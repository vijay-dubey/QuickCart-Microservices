package com.quickcart.product_service.controller;

import com.quickcart.product_service.dto.request.ProductRequest;
import com.quickcart.product_service.dto.request.ProductUpdateRequest;
import com.quickcart.product_service.dto.response.ProductResponse;
import com.quickcart.product_service.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllActiveProducts() {
        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getActiveProductById(
            @PathVariable Long id) {
        return ResponseEntity.ok(productService.getActiveProductById(id));
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<ProductResponse>> filterProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String gender) {

        if (gender != null && !gender.isEmpty()) {
            return ResponseEntity.ok(productService.getProductsByGender(gender));
        }

        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(productService.getProductsByCategory(category));
        }

        return ResponseEntity.ok(productService.getAllActiveProducts());
    }

    @GetMapping("/gender/{gender}")
    public ResponseEntity<List<ProductResponse>> getProductsByGender(
            @PathVariable String gender) {
        return ResponseEntity.ok(productService.getProductsByGender(gender));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PutMapping("/{id}/decrement-stock")
    public ResponseEntity<Void> decrementStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        productService.decrementStock(id, quantity);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/increment-stock")
    public ResponseEntity<Void> incrementStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        productService.incrementStock(id, quantity);
        return ResponseEntity.noContent().build();
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(
            @PathVariable Long id) {
        productService.deleteProduct(id);
    }
}