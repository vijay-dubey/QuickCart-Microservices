package com.quickcart.order_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.CartDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "cart-service", configuration = FeignClientConfig.class)
public interface CartClient {

    @GetMapping("/api/cart")
    CartDto getCart();

    @DeleteMapping("/api/cart")
    void deleteCart();
}


