package com.quickcart.order_service.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Data
@Table(name = "orders")
public class Order {
    public enum Status {
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
        public boolean canTransitionTo(Status newStatus) {
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

    public enum PaymentMethod {
        COD, UPI, NET_BANKING, CREDIT_CARD, DEBIT_CARD
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "shipping_address_id", nullable = false)
    private Long shippingAddressId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column
    private String paymentId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime placedAt;

    @Column
    private LocalDateTime shippedAt;

    @Column
    private LocalDateTime deliveredAt;

    @Column
    private LocalDateTime cancelledAt;

    @Column(length = 255)
    private String cancellationReason;

    @Column(length = 100)
    private String trackingNumber;

    @Column
    private LocalDateTime expectedDeliveryDate;

    @Version
    private Integer version;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingFee = new BigDecimal("90.00");

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column
    private LocalDateTime refundDeadline;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
