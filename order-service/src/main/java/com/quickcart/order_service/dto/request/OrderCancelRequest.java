package com.quickcart.order_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderCancelRequest {
    @NotBlank(message = "Cancellation reason is required")
    private String reason;
}