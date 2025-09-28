package com.quickcart.return_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReturnItemRequest {
    @NotNull
    private Long orderItemId;

    @Min(1)
    private Integer quantity;
}