package com.quickcart.order_service.controller;

import com.quickcart.common.dto.UserDto;
import com.quickcart.order_service.dto.request.OrderCancelRequest;
import com.quickcart.order_service.dto.request.OrderRequest;
import com.quickcart.order_service.dto.response.OrderResponse;
import com.quickcart.order_service.feign.UserClient;
import com.quickcart.order_service.model.Order;
import com.quickcart.order_service.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final UserClient userClient;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(@Valid @RequestBody OrderRequest request) {
        return orderService.placeOrder(request);
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrderById(
            Authentication authentication,
            @PathVariable Long orderId) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);
        boolean isAdmin = currentUser.getUserRole() == UserDto.UserRole.ADMIN;

        if (isAdmin) {
            return orderService.getOrderById(orderId);
        } else {
            return orderService.getOrderDetails(orderId, currentUser.getId());
        }
    }


    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/user/{email}")
    @PreAuthorize("#email == principal or hasRole('ADMIN')")
    public List<OrderResponse> getUserOrders(
            @PathVariable String email) {
        return orderService.getOrdersByUserEmail(email);
    }

    @PatchMapping("/{orderId}/cancel")
    public OrderResponse cancelOrder(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody OrderCancelRequest request) {

        if (authentication == null || authentication.getName() == null) {
            throw new ValidationException("Unauthenticated");
        }

        String email = authentication.getName();
        UserDto currentUser = userClient.getUserByEmail(email);

        if (currentUser == null) {
            throw new ValidationException("User not found for email: " + email);
        }

        return orderService.cancelOrder(currentUser.getId(), orderId, request);
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam Order.Status status,
            @RequestParam(required = false) String trackingNumber) {
        return orderService.updateStatus(orderId, status, trackingNumber);
    }
}