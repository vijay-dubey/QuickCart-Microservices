package com.quickcart.common.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AddressDto {
    private Long id;
    private Long userId;
    private String recipientName;
    private String recipientPhone;
    private String recipientEmail;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String landmark;
    public enum AddressType {
        HOME, WORK, OTHER
    }
    private boolean defaultAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}