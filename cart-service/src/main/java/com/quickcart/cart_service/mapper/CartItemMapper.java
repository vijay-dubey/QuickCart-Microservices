package com.quickcart.cart_service.mapper;

import com.quickcart.cart_service.dto.response.CartItemResponse;
import com.quickcart.cart_service.model.CartItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CartItemMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "productId", source = "productId")
    @Mapping(target = "quantity", source = "quantity")
    @Mapping(target = "productName", ignore = true)  // Set manually in service
    @Mapping(target = "productPrice", ignore = true) // Set manually in service
    @Mapping(target = "productImageUrl", ignore = true) // Set manually in service
    CartItemResponse toResponse(CartItem cartItem);
}