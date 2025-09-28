package com.quickcart.product_service.dto.request;

import com.quickcart.product_service.model.Product.Gender;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Size(max = 512, message = "Image URL cannot exceed 512 characters")
    private String imageUrl;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    private Gender gender = Gender.OTHER;

    @NotNull(message = "Stock is required")
    @PositiveOrZero(message = "Stock cannot be negative")
    private Integer stock;
}