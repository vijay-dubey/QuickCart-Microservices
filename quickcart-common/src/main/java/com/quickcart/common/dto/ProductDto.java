package com.quickcart.common.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductDto {
    private Long id;
    private String name;
    private boolean active;
    private BigDecimal price;
    private int stock;
    private String imageUrl;
    private String description;
    private String category;
}
