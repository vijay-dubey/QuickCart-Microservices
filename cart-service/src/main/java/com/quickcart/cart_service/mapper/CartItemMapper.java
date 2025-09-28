package com.quickcart.cart_service.mapper;

import com.quickcart.cart_service.dto.response.CartItemResponse;
import com.quickcart.cart_service.model.CartItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CartItemMapper {
    CartItemResponse toResponse(CartItem cartItem);
}