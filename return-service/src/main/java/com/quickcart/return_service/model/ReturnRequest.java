package com.quickcart.return_service.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "return_requests")
public class ReturnRequest {
    public enum Status {
        REQUESTED, APPROVED, CANCELLED, PROCESSED, REFUND_INITIATED, REFUNDED;

        public boolean canTransitionTo(Status newStatus) {
            return switch (this) {
                case REQUESTED -> newStatus == APPROVED || newStatus == CANCELLED;
                case APPROVED -> newStatus == PROCESSED || newStatus == CANCELLED;
                case PROCESSED -> newStatus == REFUND_INITIATED;
                case REFUND_INITIATED -> newStatus == REFUNDED;
                case REFUNDED, CANCELLED -> false;
            };
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.REQUESTED;

    @Column(nullable = false)
    private String type; // 'FULL' or 'PARTIAL'

    private String reason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnItem> returnItems = new ArrayList<>();
}