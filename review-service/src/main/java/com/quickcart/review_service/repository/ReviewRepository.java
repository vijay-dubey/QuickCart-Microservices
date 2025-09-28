package com.quickcart.review_service.repository;


import com.quickcart.review_service.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdAndDeletedFalseOrderByCreatedAtDesc(Long productId);

    List<Review> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    Optional<Review> findByUserIdAndProductIdAndDeletedFalse(Long userId, Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId AND r.deleted = false")
    Double getAverageRatingByProductId(Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId AND r.deleted = false")
    Integer getReviewCountByProductId(Long productId);
}
