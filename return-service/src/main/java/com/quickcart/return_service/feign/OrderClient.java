package com.quickcart.return_service.feign;

import com.quickcart.common.config.FeignClientConfig;
import com.quickcart.common.dto.OrderDto;
import com.quickcart.common.dto.OrderItemDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "order-service", configuration = FeignClientConfig.class)
public interface OrderClient {

    @GetMapping("/api/orders/{orderId}")
    OrderDto getOrderById(@PathVariable("orderId") Long orderId);

    @GetMapping("/api/order-items/{orderItemId}")
    OrderItemDto getOrderItemById(@PathVariable("orderItemId") Long orderItemId);

    @PutMapping("/api/orders/{orderId}/status")
    OrderDto updateOrderStatus(
            @PathVariable("orderId") Long orderId,
            @RequestParam("status") OrderDto.OrderStatus status,
            @RequestParam(value = "trackingNumber", required = false) String trackingNumber
    );
}

