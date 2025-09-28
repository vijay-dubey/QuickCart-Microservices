package com.quickcart.order_service.dto.response;

import com.quickcart.order_service.model.Order;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private Long userId;
    private Long shippingAddressId;
    private Order.Status status;
    private Order.PaymentStatus paymentStatus;
    private Order.PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private LocalDateTime placedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime expectedDeliveryDate;
    private String trackingNumber;
    private BigDecimal shippingFee;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal grandTotal;
    private LocalDateTime refundDeadline;
    private List<OrderItemResponse> items;
}