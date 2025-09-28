package com.quickcart.cart_service.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartResponse {
    private Long id;
    private Long userId;
    private LocalDateTime createdAt;
    private List<CartItemResponse> items;
    private BigDecimal cartTotal;
}