package com.quickcart.wishlist_service.service;

import com.quickcart.common.dto.ProductDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.wishlist_service.dto.request.WishlistItemRequest;
import com.quickcart.wishlist_service.dto.response.WishlistItemResponse;
import com.quickcart.wishlist_service.feign.ProductClient;
import com.quickcart.wishlist_service.mapper.WishlistItemMapper;
import com.quickcart.wishlist_service.model.Wishlist;
import com.quickcart.wishlist_service.model.WishlistItem;
import com.quickcart.wishlist_service.repository.WishlistItemRepository;
import com.quickcart.wishlist_service.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistItemService {
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductClient productClient;
    private final WishlistService wishlistService;
    private final WishlistItemMapper wishlistItemMapper;
    private final WishlistRepository wishlistRepository;

    @Transactional
    public WishlistItemResponse addToWishlist(Long userId, WishlistItemRequest request) {
        // Get or create user's wishlist
        Wishlist wishlist = wishlistService.getOrCreateWishlist(userId);

        // Check if product exists and is active
        ProductDto productDto = productClient.getActiveProductById(request.getProductId())
                .orElseThrow(() -> new ValidationException("Product not found or inactive"));

        // Check if product is already in wishlist
        if (wishlistItemRepository.existsByWishlist_IdAndProductId(wishlist.getId(), request.getProductId())) {
            throw new ValidationException("Product is already in your wishlist");
        }

        // Create and save wishlist item
        WishlistItem wishlistItem = new WishlistItem();
        wishlistItem.setWishlist(wishlist);
        wishlistItem.setProductId(request.getProductId());

        wishlist.getItems().add(wishlistItem);
        wishlistItemRepository.save(wishlistItem);

        WishlistItemResponse response = wishlistItemMapper.toResponse(wishlistItem);
        response.setProductName(productDto.getName());
        response.setProductPrice(productDto.getPrice());
        response.setProductImageUrl(productDto.getImageUrl());
        response.setProductDescription(productDto.getDescription());
        response.setProductCategory(productDto.getCategory());
        response.setProductStock(productDto.getStock());

        return response;
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long wishlistItemId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ValidationException("Wishlist not found"));

        // Check if wishlist item exists for the user
        int deletedCount = wishlistItemRepository.deleteByIdAndWishlist_UserId(wishlistItemId, userId);
        if (deletedCount == 0) {
            throw new ValidationException("Wishlist item not found");
        }

        if (wishlistItemRepository.countByWishlist_Id(wishlist.getId()) == 0) {
            wishlistRepository.delete(wishlist);
        }
    }

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getWishlistItems(Long userId) {
        Wishlist wishlist = wishlistService.getWishlist(userId);

        return wishlist.getItems().stream()
                .map(item -> {
                    WishlistItemResponse response = wishlistItemMapper.toResponse(item);

                    productClient.getActiveProductById(item.getProductId()).ifPresent(product -> {
                        response.setProductName(product.getName());
                        response.setProductPrice(product.getPrice());
                        response.setProductImageUrl(product.getImageUrl());
                        response.setProductDescription(product.getDescription());
                        response.setProductCategory(product.getCategory());
                        response.setProductStock(product.getStock());
                    });

                    return response;
                })
                .collect(Collectors.toList());
    }


    @Transactional
    public boolean isProductInWishlist(Long userId, Long productId) {
        Wishlist wishlist = wishlistService.getWishlist(userId);

        return wishlistItemRepository.existsByWishlist_IdAndProductId(wishlist.getId(), productId);
    }

    public WishlistItemResponse getWishlistItemById(Long userId, Long wishlistItemId) {
        WishlistItem wishlistItem = wishlistItemRepository.findByWishlist_UserIdAndId(userId, wishlistItemId)
                .orElseThrow(() -> new ValidationException("Wishlist item not found"));
        return wishlistItemMapper.toResponse(wishlistItem);
    }
}
