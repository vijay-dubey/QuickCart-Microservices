package com.quickcart.order_service.mapper;

import com.quickcart.order_service.dto.response.OrderItemResponse;
import com.quickcart.order_service.model.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {

    @Mapping(target = "productId", source = "productId")
    @Mapping(target = "itemTotal", expression = "java(calculateItemTotal(orderItem))")
    OrderItemResponse toResponse(OrderItem orderItem);

    default BigDecimal calculateItemTotal(OrderItem orderItem) {
        if (orderItem == null || orderItem.getPrice() == null || orderItem.getQuantity() == null) {
            return BigDecimal.ZERO;
        }
        return orderItem.getPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));
    }
}