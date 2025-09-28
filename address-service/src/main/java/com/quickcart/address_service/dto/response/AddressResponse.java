package com.quickcart.address_service.dto.response;

import com.quickcart.address_service.model.Address.AddressType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AddressResponse {
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
    private AddressType type;
    private boolean defaultAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}