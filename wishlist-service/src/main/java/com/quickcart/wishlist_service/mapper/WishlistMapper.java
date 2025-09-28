package com.quickcart.wishlist_service.mapper;

import com.quickcart.wishlist_service.dto.response.WishlistResponse;
import com.quickcart.wishlist_service.model.Wishlist;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {WishlistItemMapper.class})
public interface WishlistMapper {
    @Mapping(target = "totalItems", expression = "java(wishlist.getItems().size())")
    WishlistResponse toResponse(Wishlist wishlist);
}