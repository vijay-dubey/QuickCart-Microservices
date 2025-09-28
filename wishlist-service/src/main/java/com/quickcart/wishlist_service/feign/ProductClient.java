package com.quickcart.wishlist_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Optional;

@FeignClient(name = "product-service", configuration = FeignClientConfig.class)
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    Optional<ProductDto> getActiveProductById(@PathVariable("id") Long id);

}