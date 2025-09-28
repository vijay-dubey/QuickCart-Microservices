package com.quickcart.return_service.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ReturnItemResponse {
    private Long id;
    private Long orderItemId;
    private Integer quantity;
    private BigDecimal refundAmount;
}
