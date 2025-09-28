package com.quickcart.product_service.dto.request;

import com.quickcart.product_service.model.Product;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductUpdateRequest {
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Size(max = 512, message = "Image URL cannot exceed 512 characters")
    private String imageUrl;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    private Product.Gender gender;

    @PositiveOrZero(message = "Stock cannot be negative")
    private Integer stock;

    // Add active field to allow updating product status
    private Boolean active;
}