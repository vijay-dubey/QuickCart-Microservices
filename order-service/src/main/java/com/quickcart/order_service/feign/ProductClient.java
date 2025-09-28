package com.quickcart.order_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@FeignClient(name = "product-service", configuration = FeignClientConfig.class)
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    Optional<ProductDto> getProductById(@PathVariable("id") Long id);

    @PutMapping("/api/products/{id}/increment-stock")
    void incrementStock(@PathVariable("id") Long id, @RequestParam("quantity") int quantity);

    @PutMapping("/api/products/{id}/decrement-stock")
    void decrementStock(@PathVariable Long id, @RequestParam int quantity);

}
