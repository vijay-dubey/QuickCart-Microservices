package com.quickcart.return_service.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReturnRequestResponse {
    private Long id;
    private Long orderId;
    private String status;
    private String type; // "FULL" or "PARTIAL"
    private String reason;
    private LocalDateTime createdAt;
}
