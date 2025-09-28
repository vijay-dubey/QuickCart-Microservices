package com.quickcart.product_service.service;

import com.quickcart.common.exception.ValidationException;
import com.quickcart.product_service.dto.request.ProductRequest;
import com.quickcart.product_service.dto.request.ProductUpdateRequest;
import com.quickcart.product_service.dto.response.ProductResponse;
import com.quickcart.product_service.mapper.ProductMapper;
import com.quickcart.product_service.model.Product;
import com.quickcart.product_service.model.Product.Gender;
import com.quickcart.product_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = productMapper.toEntity(request);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findByActiveTrue().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getActiveProductById(Long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .map(productMapper::toResponse)
                .orElseThrow(() -> new ValidationException("Active product not found"));
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return productRepository.findById(id)
                .map(productMapper::toResponse)
                .orElseThrow(() -> new ValidationException("Product not found"));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Product not found"));
        productMapper.updateFromDto(request, product);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public void decrementStock(Long productId, int quantity) {
        Product product = productRepository.findByIdAndActiveTrueWithLock(productId)
                .orElseThrow(() -> new ValidationException("Product not available"));

        if (product.getStock() < quantity) {
            throw new ValidationException("Insufficient stock for product: " + product.getName());
        }

        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
    }

    @Transactional
    public void incrementStock(Long productId, int quantity) {
        Product product = productRepository.findByIdAndActiveTrueWithLock(productId)
                .orElseThrow(() -> new ValidationException("Product not available"));

        product.setStock(product.getStock() + quantity);
        productRepository.save(product);
    }


    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndActiveTrue(category).stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByGender(String gender) {
        try {
            Gender genderEnum = Gender.valueOf(gender.toUpperCase());
            return productRepository.findByGenderAndActiveTrue(genderEnum).stream()
                    .map(productMapper::toResponse)
                    .toList();
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid gender value");
        }
    }

    @Transactional
    public void deleteProduct(Long id) {
        // Optional: verify product exists before soft delete
        productRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Product not found"));
        productRepository.softDelete(id);
    }
}
