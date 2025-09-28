package com.quickcart.address_service.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddressUpdateRequest {
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String recipientName;

    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone format")
    private String recipientPhone;

    @Pattern(regexp = "^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$", message = "Invalid email format")
    private String recipientEmail;

    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    @Size(max = 10)
    private String postalCode;

    @Size(max = 255)
    private String landmark;
}