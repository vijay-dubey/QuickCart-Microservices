package com.quickcart.cart_service.controller;

import com.quickcart.cart_service.dto.request.CartItemRequest;
import com.quickcart.cart_service.dto.response.CartItemResponse;
import com.quickcart.cart_service.service.CartItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart-items")
@RequiredArgsConstructor
public class CartItemController {
    private final CartItemService cartItemService;

    @PostMapping
    public ResponseEntity<CartItemResponse> addItem(@Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cartItemService.addItem(request));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<CartItemResponse> getItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(cartItemService.getItem(itemId));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<CartItemResponse> updateQuantity(
            @PathVariable Long itemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(cartItemService.updateQuantity(itemId, quantity));
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(@PathVariable Long itemId) {
        cartItemService.removeItem(itemId);
    }
}