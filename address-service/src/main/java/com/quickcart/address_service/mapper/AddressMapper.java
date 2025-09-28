package com.quickcart.address_service.mapper;

import com.quickcart.address_service.dto.request.AddressRequest;
import com.quickcart.address_service.dto.request.AddressUpdateRequest;
import com.quickcart.address_service.dto.response.AddressResponse;
import com.quickcart.address_service.model.Address;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AddressMapper {
    AddressMapper INSTANCE = Mappers.getMapper(AddressMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "default", ignore = true)
    @Mapping(target = "type", ignore = true)
    Address toEntity(AddressRequest request);

    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "defaultAddress", source = "default")
    AddressResponse toResponse(Address entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "default", ignore = true)
    @Mapping(target = "type", ignore = true)
    void updateFromDto(AddressUpdateRequest dto, @MappingTarget Address entity);
}