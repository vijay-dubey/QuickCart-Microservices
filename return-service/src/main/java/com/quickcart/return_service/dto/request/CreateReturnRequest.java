package com.quickcart.return_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreateReturnRequest {
    @NotNull
    private Long orderId;

    @NotNull
    private String type; // "FULL" or "PARTIAL"

    @NotBlank
    private String reason;

    private List<ReturnItemRequest> items; // Only for PARTIAL returns
}