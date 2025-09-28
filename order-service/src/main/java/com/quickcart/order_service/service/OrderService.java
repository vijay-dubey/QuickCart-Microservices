package com.quickcart.order_service.service;

import com.quickcart.common.dto.*;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.order_service.dto.request.OrderCancelRequest;
import com.quickcart.order_service.dto.request.OrderRequest;
import com.quickcart.order_service.dto.response.OrderResponse;
import com.quickcart.order_service.feign.AddressClient;
import com.quickcart.order_service.feign.CartClient;
import com.quickcart.order_service.feign.ProductClient;
import com.quickcart.order_service.feign.UserClient;
import com.quickcart.order_service.mapper.OrderItemMapper;
import com.quickcart.order_service.mapper.OrderMapper;
import com.quickcart.order_service.model.Order;
import com.quickcart.order_service.model.OrderItem;
import com.quickcart.order_service.repository.OrderItemRepository;
import com.quickcart.order_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;

    private final UserClient userClient;
    private final AddressClient addressClient;
    private final ProductClient productClient;
    private final CartClient cartClient;

    private final OrderMapper orderMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Unauthenticated");
        }
        String email = authentication.getName();
        UserDto user = userClient.getUserByEmail(email);
        if (user == null) {
            throw new ValidationException("User not found for email: " + email);
        }
        return user.getId();
    }

    @Transactional
    public OrderResponse placeOrder(OrderRequest request) {
        // 1. Fetch user/address
        Long userId = getCurrentUserId();

        AddressDto address = addressClient.getAddressById(request.getShippingAddressId());
        if (address == null || !userId.equals(address.getUserId())) {
            throw new ValidationException("Address not found for user");
        }

        // 2. Validate stock BEFORE creating order items
        CartDto cart = cartClient.getCart();
        validateStock(cart.getItems());

        // 3. Only proceed if stock is available
        Order order = new Order();
        order.setUserId(userId);
        order.setShippingAddressId(address.getId());
        order.setPaymentMethod(Order.PaymentMethod.valueOf(request.getPaymentMethod()));
        order.setStatus(Order.Status.ORDER_PLACED);
        order.setPlacedAt(LocalDateTime.now());
        order.setExpectedDeliveryDate(LocalDateTime.now().plusDays(7));


        // 4. Convert cart items to order items and ADD TO ORDER (cascade saves them automatically)
        cart.getItems().forEach(cartItem -> {
            ProductDto product = productClient.getProductById(cartItem.getProductId())
                    .orElseThrow(() -> new ValidationException("Product not available: " + cartItem.getProductId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(cartItem.getProductId());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(product.getPrice());
            orderItem.setProductName(product.getName());
            orderItem.setProductImageUrl(product.getImageUrl());
            order.addItem(orderItem);
        });

        // 5. Calculate totals and decrement stock
        calculateTotalsAndUpdateStock(order);

        // 6. Save Order (items are saved automatically due to cascade)
        Order savedOrder = orderRepository.save(order);

        // 7. Delete cart once order is placed
        cartClient.deleteCart();

        return orderMapper.toResponse(savedOrder);
    }

    private void validateStock(List<CartItemDto> cartItems) {
        for (CartItemDto cartItem : cartItems) {
            ProductDto product = productClient.getProductById(cartItem.getProductId())
                    .orElseThrow(() -> new ValidationException(
                            "Product not available: " + cartItem.getProductId()));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new ValidationException(
                        String.format("Insufficient stock for %s (Available: %d, Requested: %d)",
                                product.getName(), product.getStock(), cartItem.getQuantity()));
            }
        }
    }

    private void calculateTotalsAndUpdateStock(Order order) {
        BigDecimal itemTotal = BigDecimal.ZERO;

        for (OrderItem item : order.getItems()) {
            // Re-fetch product with lock
            ProductDto product = productClient.getProductById(item.getProductId())
                    .orElseThrow(() -> new ValidationException("Product not available: " + item.getProductId()));

            // Call product-service to decrement stock
            productClient.decrementStock(item.getProductId(), item.getQuantity());

            // Calculate item subtotal
            itemTotal = itemTotal.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        // Shipping + GST Calculation
        BigDecimal shippingFee = new BigDecimal("90.00");
        BigDecimal taxableAmount = itemTotal.add(shippingFee);
        BigDecimal gst = taxableAmount.multiply(new BigDecimal("0.18"));

        order.setTotalAmount(taxableAmount.add(gst)); // (itemTotal + shipping + GST)
        order.setShippingFee(shippingFee);
        order.setCgstAmount(gst.divide(new BigDecimal("2"))); // 9% CGST
        order.setSgstAmount(gst.divide(new BigDecimal("2"))); // 9% SGST
    }


    @Transactional(readOnly = true)
    public OrderResponse getOrderDetails(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ValidationException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ValidationException("Order access denied");
        }

        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId, OrderCancelRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ValidationException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ValidationException("Order access denied");
        }

        if (!order.getStatus().isCancellable()) {
            throw new ValidationException(
                    String.format("Cannot cancel order in %s state", order.getStatus())
            );
        }

        // Validate reason
        if (!order.getStatus().getCancellationReasons().contains(request.getReason())) {
            throw new ValidationException("Invalid cancellation reason");
        }

        order.setCancellationReason(request.getReason());

        // Restock items
        order.getItems().forEach(item -> {
            ProductDto product = productClient.getProductById(item.getProductId())
                    .orElseThrow(() -> new ValidationException("Product not found"));
            // Call product-service to increase stock
            productClient.incrementStock(item.getProductId(), item.getQuantity());
        });

        order.setStatus(Order.Status.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());

        return orderMapper.toResponse(orderRepository.save(order));
    }

    public List<OrderResponse> getOrdersByUserEmail(String email) {
        UserDto user = userClient.getUserByEmail(email);
        if (user == null) {
            throw new ValidationException("User not found for email: " + email);
        }

        return orderRepository.findByUserId(user.getId()).stream()
                .map(orderMapper::toResponse)
                .toList();
    }



    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ValidationException("Order not found"));
        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, Order.Status status, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ValidationException("Order not found"));

        if (!order.getStatus().canTransitionTo(status)) {
            throw new ValidationException("Invalid status transition");
        }

        if (status == Order.Status.DELIVERED && order.getPaymentStatus() != Order.PaymentStatus.PAID) {
            throw new ValidationException("Cannot deliver order with payment status: " + order.getPaymentStatus());
        }

        switch (status) {
            case SHIPPED:
                order.setShippedAt(LocalDateTime.now());
                order.setTrackingNumber(trackingNumber);
                break;
            case DELIVERED:
                order.setDeliveredAt(LocalDateTime.now());
                order.setRefundDeadline(LocalDateTime.now().plusDays(14));
                break;
        }

        order.setStatus(status);
        return orderMapper.toResponse(orderRepository.save(order));
    }

}