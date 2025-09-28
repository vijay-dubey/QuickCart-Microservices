package com.quickcart.product_service.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column
    private String name;

    @Column
    private String description;

    @Column
    @Positive(message = "Price must be a positive value")
    private BigDecimal price;

    @Column
    @PositiveOrZero(message = "Stock must be a non-negative integer")
    private int stock;

    @Column
    private String imageUrl;

    @Column
    private String category;

    @Enumerated(EnumType.STRING)
    @Column
    private Gender gender = Gender.OTHER;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column
    private LocalDateTime updatedAt;

    public enum Gender {
        MEN, WOMEN, KIDS, GENZ, OTHER
    }
}