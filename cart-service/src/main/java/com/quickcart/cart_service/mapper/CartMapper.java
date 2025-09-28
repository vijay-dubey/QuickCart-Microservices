package com.quickcart.cart_service.mapper;

import com.quickcart.cart_service.dto.response.CartResponse;
import com.quickcart.cart_service.model.Cart;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = CartItemMapper.class)
public interface CartMapper {
    @Mapping(target = "cartTotal", ignore = true) // Set manually in service
    CartResponse toResponse(Cart cart);
}