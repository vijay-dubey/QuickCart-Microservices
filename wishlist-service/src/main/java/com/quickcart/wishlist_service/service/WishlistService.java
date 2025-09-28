package com.quickcart.wishlist_service.service;

import com.quickcart.common.exception.ValidationException;
import com.quickcart.wishlist_service.dto.response.WishlistResponse;
import com.quickcart.wishlist_service.feign.ProductClient;
import com.quickcart.wishlist_service.mapper.WishlistMapper;
import com.quickcart.wishlist_service.model.Wishlist;
import com.quickcart.wishlist_service.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final WishlistMapper wishlistMapper;
    private final ProductClient productClient;

    @Transactional(readOnly = true)
    public Wishlist getWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ValidationException("Wishlist not found for user"));
    }


    @Transactional
    public Wishlist getOrCreateWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wishlist newWishlist = new Wishlist();
                    newWishlist.setUserId(userId);
                    return wishlistRepository.save(newWishlist);
                });
    }

    @Transactional
    public WishlistResponse getWishlistResponse(Long userId) {
        Wishlist wishlist = getWishlist(userId);
        WishlistResponse response = wishlistMapper.toResponse(wishlist);

        response.getItems().forEach(item -> {
            productClient.getActiveProductById(item.getProductId()).ifPresent(product -> {
                item.setProductName(product.getName());
                item.setProductPrice(product.getPrice());
                item.setProductImageUrl(product.getImageUrl());
                item.setProductDescription(product.getDescription());
                item.setProductCategory(product.getCategory());
                item.setProductStock(product.getStock());
            });
        });

        return response;
    }


    @Transactional
    public void deleteWishlist(Long userId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ValidationException("No wishlist found for user"));
        wishlistRepository.delete(wishlist);
    }
}
