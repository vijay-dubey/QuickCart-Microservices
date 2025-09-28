package com.quickcart.wishlist_service.mapper;

import com.quickcart.wishlist_service.dto.response.WishlistItemResponse;
import com.quickcart.wishlist_service.model.WishlistItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WishlistItemMapper {
    WishlistItemResponse toResponse(WishlistItem wishlistItem);
}