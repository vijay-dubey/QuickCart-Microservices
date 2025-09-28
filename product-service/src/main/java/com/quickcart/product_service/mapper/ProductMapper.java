package com.quickcart.product_service.mapper;

import com.quickcart.product_service.dto.request.ProductRequest;
import com.quickcart.product_service.dto.request.ProductUpdateRequest;
import com.quickcart.product_service.dto.response.ProductResponse;
import com.quickcart.product_service.feign.ReviewClient;
import com.quickcart.product_service.model.Product;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class ProductMapper {

    @Autowired
    protected ReviewClient reviewFeignClient;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", constant = "true")
    public abstract Product toEntity(ProductRequest request);

    @Mapping(target = "averageRating", expression = "java(getAverageRating(entity.getId()))")
    @Mapping(target = "reviewCount", expression = "java(getReviewCount(entity.getId()))")
    public abstract ProductResponse toResponse(Product entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    public abstract void updateFromDto(ProductUpdateRequest dto, @MappingTarget Product entity);


    protected Double getAverageRating(Long productId) {
        try {
            return reviewFeignClient.getAverageRatingByProductId(productId);
        } catch (Exception e) {
            return 0.0; // fallback
        }
    }

    protected Integer getReviewCount(Long productId) {
        try {
            return reviewFeignClient.getReviewCountByProductId(productId);
        } catch (Exception e) {
            return 0; // fallback
        }
    }
}
