package com.quickcart.address_service.controller;

import com.quickcart.address_service.dto.request.AddressRequest;
import com.quickcart.address_service.dto.request.AddressTypeRequest;
import com.quickcart.address_service.dto.request.AddressUpdateRequest;
import com.quickcart.address_service.dto.response.AddressResponse;
import com.quickcart.address_service.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService addressService;

    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(@Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.createAddress(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<AddressResponse>> getUserAddresses() {
        return ResponseEntity.ok(addressService.getAddresses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddressResponse> getAddressById(@PathVariable Long id) {
        return ResponseEntity.ok(addressService.getAddressById(id));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Long addressId,
            @Valid @RequestBody AddressUpdateRequest request) {
        return ResponseEntity.ok(addressService.updateAddress(addressId, request));
    }

    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@PathVariable Long addressId) {
        addressService.deleteAddress(addressId);
    }

    @PostMapping("/{addressId}/default")
    public ResponseEntity<AddressResponse> setDefaultAddress(@PathVariable Long addressId) {
        return ResponseEntity.ok(addressService.setDefaultAddress(addressId));
    }

    @PatchMapping("/{addressId}/type")
    public ResponseEntity<AddressResponse> changeAddressType(@PathVariable Long addressId,
            @Valid @RequestBody AddressTypeRequest request) {
        return ResponseEntity.ok(addressService.changeAddressType(addressId, request));
    }
}