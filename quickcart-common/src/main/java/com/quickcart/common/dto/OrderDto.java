package com.quickcart.common.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
public class OrderDto {
    private Long id;
    private Long userId;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private LocalDateTime placedAt;
    private List<OrderItemDto> items;
    private LocalDateTime refundDeadline;

    public enum OrderStatus {
        ORDER_PLACED,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED,
        RETURNED,
        PARTIALLY_RETURNED,
        REFUND_INITIATED,
        REFUNDED;

        // Business rule: Which statuses allow cancellation?
        public boolean isCancellable() {
            return this == ORDER_PLACED || this == PROCESSING;
        }

        // State transition rules
        public boolean canTransitionTo(OrderStatus newStatus) {
            return switch (this) {
                case ORDER_PLACED ->
                        newStatus == PROCESSING || newStatus == CANCELLED;
                case PROCESSING ->
                        newStatus == SHIPPED || newStatus == CANCELLED;
                case SHIPPED ->
                        newStatus == DELIVERED || newStatus == RETURNED;
                case DELIVERED ->
                        newStatus == RETURNED || newStatus == PARTIALLY_RETURNED;
                case RETURNED, PARTIALLY_RETURNED, CANCELLED ->
                        newStatus == REFUND_INITIATED;
                case REFUND_INITIATED ->
                        newStatus == REFUNDED;
                case REFUNDED ->
                        false; // Terminal state
            };
        }

        public List<String> getCancellationReasons() {
            return switch (this) {
                case ORDER_PLACED -> List.of(
                        "Changed mind",
                        "Found better price",
                        "Delivery timeframe too long",
                        "Other"
                );
                case PROCESSING -> List.of(
                        "Processing delay",
                        "Payment issue",
                        "Duplicate order",
                        "Other"
                );
                default -> Collections.emptyList();
            };
        }
    }

    public enum PaymentStatus {
        PENDING, PAID, FAILED, REFUNDED
    }
}
