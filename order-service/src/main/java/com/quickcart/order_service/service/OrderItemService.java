package com.quickcart.order_service.service;

import com.quickcart.common.dto.*;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.order_service.dto.response.OrderItemResponse;
import com.quickcart.order_service.feign.UserClient;
import com.quickcart.order_service.mapper.OrderItemMapper;
import com.quickcart.order_service.model.OrderItem;
import com.quickcart.order_service.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderItemMapper orderItemMapper;
    private final UserClient userClient;

    @Transactional(readOnly = true)
    public OrderItemResponse getOrderItemById(Long orderItemId, String email) {
        UserDto currentUser = userClient.getUserByEmail(email);
        if (currentUser == null) {
            throw new ValidationException("User not found for email: " + email);
        }

        // Fetch order item
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ValidationException("Order item not found"));

        // Validate access
        Long ownerId = orderItem.getOrder().getUserId();
        boolean isOwner = currentUser.getId().equals(ownerId);
        boolean isAdmin = currentUser.getUserRole() == UserDto.UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ValidationException("Access denied: you cannot view this order item");
        }

        return orderItemMapper.toResponse(orderItem);
    }
}
