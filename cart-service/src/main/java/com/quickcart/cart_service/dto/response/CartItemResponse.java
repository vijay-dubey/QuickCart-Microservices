package com.quickcart.cart_service.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CartItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal productPrice;
    private String productImageUrl;
    private Integer quantity;
}