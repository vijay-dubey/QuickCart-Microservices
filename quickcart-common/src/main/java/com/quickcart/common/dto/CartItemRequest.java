package com.quickcart.common.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CartItemRequest {
    @Positive(message = "Product ID must be positive")
    private Long productId;

    @Positive(message = "Quantity must be positive")
    private Integer quantity;
}
