package com.quickcart.review_service.mapper;

import com.quickcart.review_service.dto.request.ReviewRequest;
import com.quickcart.review_service.dto.response.ReviewResponse;
import com.quickcart.review_service.model.Review;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "productId", source = "productId")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "approved", ignore = true)
    @Mapping(target = "deleted", constant = "false")
    Review toEntity(ReviewRequest request, Long userId, Long productId);

    ReviewResponse toResponse(Review entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    void updateFromDto(ReviewRequest dto, @MappingTarget Review entity);
}
