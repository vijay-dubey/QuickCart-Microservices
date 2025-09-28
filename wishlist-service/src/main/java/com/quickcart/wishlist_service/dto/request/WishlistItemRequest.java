package com.quickcart.wishlist_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WishlistItemRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;
}