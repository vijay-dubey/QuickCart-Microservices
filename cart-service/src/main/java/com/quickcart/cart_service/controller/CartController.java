package com.quickcart.cart_service.controller;

import com.quickcart.cart_service.dto.response.CartResponse;
import com.quickcart.cart_service.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping()
    public ResponseEntity<CartResponse> getCart() {
        return ResponseEntity.ok(cartService.getCartResponse());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCart() {
        cartService.deleteCart();
    }
}
