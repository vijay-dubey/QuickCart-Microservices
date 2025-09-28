package com.quickcart.wishlist_service.controller;

import com.quickcart.common.dto.CartItemRequest;
import com.quickcart.common.dto.UserDto;
import com.quickcart.wishlist_service.dto.request.WishlistItemRequest;
import com.quickcart.wishlist_service.dto.response.WishlistItemResponse;
import com.quickcart.wishlist_service.feign.CartClient;
import com.quickcart.wishlist_service.feign.UserClient;
import com.quickcart.wishlist_service.service.WishlistItemService;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist-items")
@RequiredArgsConstructor
public class WishlistItemController {

    private final WishlistItemService wishlistItemService;
    private final UserClient userClient;
    private final CartClient cartClient;

    @PostMapping
    public ResponseEntity<WishlistItemResponse> addToWishlist(
            Authentication authentication,
            @Valid @RequestBody WishlistItemRequest request) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        WishlistItemResponse response = wishlistItemService.addToWishlist(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWishlist(
            Authentication authentication,
            @PathVariable Long id) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        wishlistItemService.removeFromWishlist(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<WishlistItemResponse>> getWishlistItems(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        List<WishlistItemResponse> items = wishlistItemService.getWishlistItems(currentUser.getId());
        return ResponseEntity.ok(items);
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<Boolean> isProductInWishlist(
            Authentication authentication,
            @PathVariable Long productId) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        boolean inWishlist = wishlistItemService.isProductInWishlist(currentUser.getId(), productId);
        return ResponseEntity.ok(inWishlist);
    }

    @PostMapping("/{id}/move-to-cart")
    public ResponseEntity<Void> moveToCart(
            Authentication authentication,
            @PathVariable Long id) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        WishlistItemResponse wishlistItem = wishlistItemService.getWishlistItemById(currentUser.getId(), id);

        if (wishlistItem != null) {
            // Add to cart
            CartItemRequest cartRequest = new CartItemRequest();
            cartRequest.setProductId(wishlistItem.getProductId());
            cartRequest.setQuantity(1);

            cartClient.addItemToCart(cartRequest);

            // Remove from wishlist
            wishlistItemService.removeFromWishlist(currentUser.getId(), id);
        }

        return ResponseEntity.ok().build();
    }
}