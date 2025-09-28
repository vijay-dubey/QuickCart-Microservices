package com.quickcart.address_service.service;

import com.quickcart.address_service.dto.request.AddressRequest;
import com.quickcart.address_service.dto.request.AddressTypeRequest;
import com.quickcart.address_service.dto.request.AddressUpdateRequest;
import com.quickcart.address_service.dto.response.AddressResponse;
import com.quickcart.address_service.feign.UserClient;
import com.quickcart.common.dto.UserDto;
import com.quickcart.common.exception.ValidationException;
import com.quickcart.address_service.mapper.AddressMapper;
import com.quickcart.address_service.model.Address;
import com.quickcart.address_service.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {
    private final AddressRepository addressRepository;
    private final AddressMapper addressMapper;
    private final UserClient userClient;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Unauthenticated");
        }
        String email = authentication.getName();
        UserDto user = userClient.getUserByEmail(email);
        if (user == null) {
            throw new ValidationException("User not found for email: " + email);
        }
        return user.getId();
    }

    @Transactional
    public AddressResponse createAddress(AddressRequest request) {
        Long userId = getCurrentUserId();
        Address address = addressMapper.toEntity(request);
        address.setUserId(userId);

        AddressResponse response = addressMapper.toResponse(addressRepository.save(address));
        response.setUserId(userId);

        return response;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses() {
        Long userId = getCurrentUserId();

        return addressRepository.findActiveByUserId(userId)
                .stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AddressResponse getAddressById(Long id) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Address not found with id: " + id));
        return addressMapper.toResponse(address);
    }

    @Transactional
    public AddressResponse updateAddress(Long addressId, AddressUpdateRequest request) {
        Long userId = getCurrentUserId();
        Address address = getValidatedAddress(addressId);

        addressMapper.updateFromDto(request, address);

        AddressResponse response = addressMapper.toResponse(addressRepository.save(address));
        response.setUserId(userId);

        return response;
    }

    @Transactional
    public void deleteAddress(Long addressId) {
        Long userId = getCurrentUserId();
        Address address = getValidatedAddress(addressId);
        address.setDeleted(true);
        addressRepository.save(address);
    }

    @Transactional
    public AddressResponse setDefaultAddress(Long addressId) {
        Long userId = getCurrentUserId();
        Address address = getValidatedAddress(addressId);
        clearExistingDefaults(userId);
        address.setDefault(true);
        AddressResponse response = addressMapper.toResponse(addressRepository.save(address));
        response.setUserId(userId);

        return response;
    }

    @Transactional
    public AddressResponse changeAddressType(Long addressId, AddressTypeRequest request) {
        Long userId = getCurrentUserId();
        Address address = getValidatedAddress(addressId);

        address.setType(request.getType());
        AddressResponse response = addressMapper.toResponse(addressRepository.save(address));
        response.setUserId(userId);

        return response;
    }

    private Address getValidatedAddress(Long addressId) {
        Long userId = getCurrentUserId();

        return addressRepository.findByIdAndUserIdAndDeletedFalse(addressId, userId)
                .orElseThrow(() -> new ValidationException("Address not found"));
    }

    private void clearExistingDefaults(Long userId) {
        addressRepository.findByUserIdAndIsDefault(userId, true)
                .forEach(addr -> {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                });
    }
}
