package com.quickcart.review_service.service;

import com.quickcart.common.dto.ProductDto;
import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.review_service.dto.request.ReviewRequest;
import com.quickcart.review_service.dto.response.ReviewResponse;
import com.quickcart.review_service.kafka.ReviewKafkaProducer;
import com.quickcart.review_service.mapper.ReviewMapper;
import com.quickcart.review_service.model.Review;
import com.quickcart.review_service.repository.ReviewRepository;
import com.quickcart.review_service.feign.UserClient;
import com.quickcart.review_service.feign.ProductClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.access.AccessDeniedException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;
    private final UserClient userClient;
    private final ProductClient productClient;
    private final ReviewKafkaProducer reviewKafkaProducer;


    private Long getCurrentUserId() throws AccessDeniedException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        UserDto user = userClient.getUserByEmail(email);
        if (user == null) {
            throw new ValidationException("User not found for email: " + email);
        }

        return user.getId();
    }

    @Transactional
    public ReviewResponse createReview(ReviewRequest request) throws AccessDeniedException {
        Long userId = getCurrentUserId();

        ProductDto product = productClient.getProductById(request.getProductId())
                .orElseThrow(() -> new ValidationException("Product not found"));

        if (!product.isActive()) {
            throw new ValidationException("Product is not active");
        }

        Optional<Review> existingReview = reviewRepository.findByUserIdAndProductIdAndDeletedFalse(userId, request.getProductId());
        if (existingReview.isPresent()) {
            throw new ValidationException("You have already reviewed this product");
        }

        Review review = reviewMapper.toEntity(request, userId, product.getId());
        review.setApproved(true);

        // Save first
        Review savedReview = reviewRepository.save(review);

        // Emit Kafka event
        reviewKafkaProducer.sendReviewEvent("Review created by userId: " + userId + " for productId: " + request.getProductId());

        // Then return response
        return reviewMapper.toResponse(savedReview);
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewRequest request) throws AccessDeniedException {
        Long userId = getCurrentUserId();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ValidationException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to update this review");
        }

        reviewMapper.updateFromDto(request, review);
        review.setApproved(true);

        // Save first
        Review savedReview = reviewRepository.save(review);

        // Emit Kafka event
        reviewKafkaProducer.sendReviewEvent("Review updated for reviewId: " + reviewId);

        // Then return response
        return reviewMapper.toResponse(savedReview);
    }

    @Transactional
    public void deleteReview(Long reviewId) throws AccessDeniedException {
        Long userId = getCurrentUserId();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ValidationException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to delete this review");
        }

        review.setDeleted(true);
        reviewRepository.save(review);

        reviewKafkaProducer.sendReviewEvent("Review deleted with reviewId: " + reviewId);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdAndDeletedFalseOrderByCreatedAtDesc(productId).stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReviews() throws AccessDeniedException {
        Long userId = getCurrentUserId();
        return reviewRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId).stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Double getAverageRatingByProductId(Long productId) {
        return reviewRepository.getAverageRatingByProductId(productId);
    }

    @Transactional(readOnly = true)
    public Integer getReviewCountByProductId(Long productId) {
        return reviewRepository.getReviewCountByProductId(productId);
    }

    @Transactional
    public ReviewResponse approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ValidationException("Review not found"));

        review.setApproved(true);
        return reviewMapper.toResponse(reviewRepository.save(review));
    }
}
