package com.quickcart.wishlist_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.CartItemRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "cart-service", configuration = FeignClientConfig.class)
public interface CartClient {
    @PostMapping("/api/cart-items")
    ResponseEntity<Void> addItemToCart(@RequestBody CartItemRequest request);
}