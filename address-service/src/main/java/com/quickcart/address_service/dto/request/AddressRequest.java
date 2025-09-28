package com.quickcart.address_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank(message = "Recipient name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String recipientName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone format")
    private String recipientPhone;

    @Pattern(regexp = "^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$", message = "Invalid email format")
    private String recipientEmail;

    @NotBlank(message = "Address line 1 is required")
    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100)
    private String state;

    @NotBlank(message = "Country is required")
    @Size(max = 100)
    private String country;

    @NotBlank(message = "Postal code is required")
    @Size(max = 10)
    private String postalCode;

    @Size(max = 255)
    private String landmark;
}
