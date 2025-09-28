package com.quickcart.wishlist_service.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class WishlistResponse {
    private Long id;
    private Long userId;
    private int totalItems;
    private List<WishlistItemResponse> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
