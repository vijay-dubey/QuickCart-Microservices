package com.quickcart.return_service.repository;


import com.quickcart.return_service.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findByUserId(Long userId);
    Optional<ReturnRequest> findByIdAndUserId(Long id, Long userId);
    boolean existsByOrderIdAndStatusIn(Long orderId, List<ReturnRequest.Status> statuses);
    List<ReturnRequest> findByOrderId(Long orderId);
}