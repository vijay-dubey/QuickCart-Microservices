package com.quickcart.common.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartDto {
    private Long id;
    private Long userId;
    private LocalDateTime createdAt;
    private List<CartItemDto> items;
    private BigDecimal cartTotal;
}