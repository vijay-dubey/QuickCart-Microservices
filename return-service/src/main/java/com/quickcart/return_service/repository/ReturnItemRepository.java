package com.quickcart.return_service.repository;

import com.quickcart.return_service.model.ReturnItem;
import com.quickcart.return_service.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {
    List<ReturnItem> findByReturnRequestId(Long returnRequestId);

    @Query("SELECT COALESCE(SUM(ri.quantity), 0) FROM ReturnItem ri WHERE ri.orderItemId = :orderItemId AND ri.returnRequest.status IN :statuses")
    Integer sumQuantitiesByOrderItemAndStatusIn(@Param("orderItemId") Long orderItemId,
                                                @Param("statuses") List<ReturnRequest.Status> statuses);
}
