package com.quickcart.cart_service.service;

import com.quickcart.cart_service.dto.request.CartItemRequest;
import com.quickcart.cart_service.dto.response.CartItemResponse;
import com.quickcart.cart_service.feign.ProductClient;
import com.quickcart.cart_service.model.Cart;
import com.quickcart.cart_service.model.CartItem;
import com.quickcart.cart_service.repository.CartItemRepository;
import com.quickcart.cart_service.repository.CartRepository;
import com.quickcart.common.dto.ProductDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.cart_service.mapper.CartItemMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartItemService {

    private final CartService cartService;
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    private final CartItemMapper cartItemMapper;
    private final ProductClient productClient;

    @Transactional
    public CartItemResponse addItem(CartItemRequest request) {
        Cart cart = cartService.getOrCreateCart();

        ProductDto product = productClient.getProductById(request.getProductId())
                .orElseThrow(() -> new ValidationException("Active product not found"));

        validateStockForUser(product, request.getQuantity(), cart);

        CartItem item = cartItemRepository.findByCart_IdAndProductId(cart.getId(), product.getId())
                .map(existingItem -> {
                    existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
                    return existingItem;
                })
                .orElseGet(() -> {
                    CartItem newItem = new CartItem();
                    newItem.setCart(cart);
                    newItem.setProductId(product.getId());
                    newItem.setQuantity(request.getQuantity());
                    return newItem;
                });

        CartItemResponse response = cartItemMapper.toResponse(cartItemRepository.save(item));
        response.setProductName(product.getName());
        response.setProductPrice(product.getPrice());
        response.setProductImageUrl(product.getImageUrl());
        return response;

    }

    @Transactional(readOnly = true)
    public CartItemResponse getItem(Long itemId) {
        Cart cart = cartService.getOrCreateCart();
        CartItem cartItem = cartItemRepository.findByCart_IdAndId(cart.getId(), itemId)
                .orElseThrow(() -> new ValidationException("Cart item not found"));

        CartItemResponse response = cartItemMapper.toResponse(cartItem);

        ProductDto product = productClient.getProductById(cartItem.getProductId())
                .orElseThrow(() -> new ValidationException("Active product not found"));

        response.setProductName(product.getName());
        response.setProductPrice(product.getPrice());
        response.setProductImageUrl(product.getImageUrl());
        return response;
    }

    @Transactional
    public void removeItem(Long itemId) {
        Cart cart = cartService.getOrCreateCart();
        CartItem item = cartItemRepository.findByCart_IdAndId(cart.getId(), itemId)
                .orElseThrow(() -> new ValidationException("Item not found in cart"));

        cartItemRepository.deleteByIdAndCartUser_Id(itemId, cart.getUserId());

        if (cartItemRepository.countByCartId(cart.getId()) == 0) {
            cartRepository.deleteCartById(cart.getId());
        }
    }

    @Transactional
    public CartItemResponse updateQuantity(Long itemId, int newQuantity) {
        Cart cart = cartService.getOrCreateCart();
        CartItem item = cartItemRepository.findByCart_IdAndId(cart.getId(), itemId)
                .orElseThrow(() -> new ValidationException("Item not found in cart"));

        if (newQuantity <= 0) {
            cartItemRepository.deleteByIdAndCartUser_Id(itemId, cart.getUserId());

            if (cartItemRepository.countByCartId(cart.getId()) == 0) {
                cartRepository.deleteCartById(cart.getId());
            }

            return null;
        }

        ProductDto product = productClient.getProductById(item.getProductId())
                .orElseThrow(() -> new ValidationException("Active product not found"));

        validateStockForUser(product, newQuantity - item.getQuantity(), cart);

        item.setQuantity(newQuantity);
        CartItemResponse response = cartItemMapper.toResponse(cartItemRepository.save(item));
        response.setProductName(product.getName());
        response.setProductPrice(product.getPrice());
        response.setProductImageUrl(product.getImageUrl());
        return response;

    }

    private void validateStockForUser(ProductDto product, int additionalQty, Cart cart) {
        int currentUserQty = cartItemRepository.sumQuantityByProductAndCart(product.getId(), cart.getId());
        int totalRequested = currentUserQty + additionalQty;

        if (product.getStock() < totalRequested) {
            throw new ValidationException(
                    String.format("Only %d units available", product.getStock())
            );
        }
    }
}
