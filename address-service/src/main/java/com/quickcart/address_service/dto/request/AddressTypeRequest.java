package com.quickcart.address_service.dto.request;

import com.quickcart.address_service.model.Address.AddressType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddressTypeRequest {
    @NotNull(message = "Address type is required")
    private AddressType type;
}