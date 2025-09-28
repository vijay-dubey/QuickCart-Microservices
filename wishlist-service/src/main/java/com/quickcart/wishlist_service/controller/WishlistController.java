package com.quickcart.wishlist_service.controller;

import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.wishlist_service.dto.response.WishlistResponse;
import com.quickcart.wishlist_service.feign.UserClient;
import com.quickcart.wishlist_service.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {
    private final WishlistService wishlistService;
    private final UserClient userClient;

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        WishlistResponse wishlist = wishlistService.getWishlistResponse(currentUser.getId());
        return ResponseEntity.ok(wishlist);
    }

    @DeleteMapping
    public ResponseEntity<Void> clearWishlist(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        wishlistService.deleteWishlist(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
