package com.quickcart.product_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "review-service",
        path = "/api/reviews",
        configuration = FeignClientConfig.class
)
public interface ReviewClient {

    @GetMapping("/product/{productId}/rating")
    Double getAverageRatingByProductId(@PathVariable Long productId);

    @GetMapping("/product/{productId}/count")
    Integer getReviewCountByProductId(@PathVariable Long productId);
}
