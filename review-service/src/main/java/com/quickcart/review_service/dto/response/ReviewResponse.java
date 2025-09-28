package com.quickcart.review_service.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long productId;
    private Integer rating;
    private String comment;
    private boolean approved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}