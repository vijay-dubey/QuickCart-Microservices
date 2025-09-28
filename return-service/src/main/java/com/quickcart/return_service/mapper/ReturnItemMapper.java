package com.quickcart.return_service.mapper;


import com.quickcart.return_service.dto.response.ReturnItemResponse;
import com.quickcart.return_service.model.ReturnItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReturnItemMapper {
    @Mapping(target = "orderItemId", source = "orderItemId")
    ReturnItemResponse toResponse(ReturnItem returnItem);
}