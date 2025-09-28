package com.quickcart.order_service.controller;

import com.quickcart.common.dto.UserDto;
import com.quickcart.order_service.dto.response.OrderItemResponse;
import com.quickcart.order_service.feign.UserClient;
import com.quickcart.order_service.service.OrderItemService;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/order-items")
@RequiredArgsConstructor
public class OrderItemController {
    private final OrderItemService orderItemService;
    private final UserClient userClient;

    @GetMapping("/{orderItemId}")
    public OrderItemResponse getOrderItemById(
            Authentication authentication,
            @PathVariable Long orderItemId) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        if (currentUser == null) {
            throw new ValidationException("User not found for email: " + email);
        }

        return orderItemService.getOrderItemById(orderItemId, currentUser.getEmail());
    }
}