package com.quickcart.address_service.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "addresses")
public class Address {
    public enum AddressType {
        HOME, WORK, OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String recipientName;

    @Column(nullable = false, length = 15)
    private String recipientPhone;

    @Column(length = 255)
    private String recipientEmail;

    @Column(nullable = false, length = 255)
    private String addressLine1;

    @Column(length = 255)
    private String addressLine2;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 100)
    private String country;

    @Column(nullable = false, length = 10)
    private String postalCode;

    @Column(length = 255)
    private String landmark;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AddressType type = AddressType.HOME;

    @Column(nullable = false)
    private boolean isDefault = false;

    @Column(nullable = false)
    private boolean deleted = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}