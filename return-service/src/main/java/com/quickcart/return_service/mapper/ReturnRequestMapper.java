package com.quickcart.return_service.mapper;


import com.quickcart.return_service.dto.response.ReturnRequestResponse;
import com.quickcart.return_service.model.ReturnRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReturnRequestMapper {
    @Mapping(target = "orderId", source = "orderId")
    ReturnRequestResponse toResponse(ReturnRequest returnRequest);
}
