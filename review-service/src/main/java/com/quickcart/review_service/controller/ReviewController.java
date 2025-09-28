package com.quickcart.review_service.controller;

import com.quickcart.review_service.dto.request.ReviewRequest;
import com.quickcart.review_service.dto.response.ReviewResponse;
import com.quickcart.review_service.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable("id") Long reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable("id") Long reviewId) {
        reviewService.deleteReview(reviewId);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProductId(productId));
    }

    @GetMapping("/my-reviews")
    public ResponseEntity<List<ReviewResponse>> getUserReviews() {
        return ResponseEntity.ok(reviewService.getUserReviews());
    }

    @GetMapping("/product/{productId}/rating")
    public ResponseEntity<Double> getAverageRatingByProductId(@PathVariable Long productId) {
        Double averageRating = reviewService.getAverageRatingByProductId(productId);
        return ResponseEntity.ok(averageRating != null ? averageRating : 0.0);
    }

    @GetMapping("/product/{productId}/count")
    public ResponseEntity<Integer> getReviewCountByProductId(@PathVariable Long productId) {
        Integer reviewCount = reviewService.getReviewCountByProductId(productId);
        return ResponseEntity.ok(reviewCount != null ? reviewCount : 0);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> approveReview(@PathVariable("id") Long reviewId) {
        return ResponseEntity.ok(reviewService.approveReview(reviewId));
    }
}
