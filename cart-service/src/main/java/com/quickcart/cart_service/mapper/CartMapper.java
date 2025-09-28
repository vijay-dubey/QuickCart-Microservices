package com.quickcart.cart_service.mapper;

import com.quickcart.cart_service.dto.response.CartResponse;
import com.quickcart.cart_service.model.Cart;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = CartItemMapper.class)
public interface CartMapper {
    CartResponse toResponse(Cart cart);
}