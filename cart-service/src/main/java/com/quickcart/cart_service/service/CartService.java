package com.quickcart.cart_service.service;

import com.quickcart.cart_service.dto.response.CartResponse;
import com.quickcart.cart_service.feign.ProductClient;
import com.quickcart.cart_service.feign.UserClient;
import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.cart_service.mapper.CartMapper;
import com.quickcart.cart_service.model.Cart;
import com.quickcart.cart_service.repository.CartRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final CartMapper cartMapper;
    private final UserClient userClient;
    private final ProductClient productClient;


    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Unauthenticated");
        }
        String email = authentication.getName();
        UserDto user = userClient.getUserByEmail(email);
        if (user == null) {
            throw new ValidationException("User not found for email: " + email);
        }
        return user.getId();
    }


    @Transactional
    public Cart getOrCreateCart() {
        Long userId = getCurrentUserId();

        if (userId == null) {
            throw new ValidationException("User not found");
        }

        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUserId(userId);
                    return cartRepository.save(newCart);
                });
    }

    @Transactional
    public CartResponse getCartResponse() {
        Cart cart = getOrCreateCart();

        CartResponse response = cartMapper.toResponse(cart);

        BigDecimal total = cart.getItems().stream()
                .map(item -> {
                    return productClient.getProductById(item.getProductId())
                            .map(product -> BigDecimal.valueOf(item.getQuantity())
                                    .multiply(product.getPrice()))
                            .orElse(BigDecimal.ZERO);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);


        response.setCartTotal(total);

        return response;
    }

    @Transactional
    public void deleteCart() {
        Long userId = getCurrentUserId();

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ValidationException("No cart found for user"));
        cartRepository.delete(cart);
    }
}