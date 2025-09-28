package com.quickcart.product_service.repository;

import com.quickcart.product_service.model.Product;
import com.quickcart.product_service.model.Product.Gender;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByActiveTrue();

    Optional<Product> findByIdAndActiveTrue(Long id);

    List<Product> findByCategoryAndActiveTrue(String category);

    List<Product> findByGenderAndActiveTrue(Gender gender);

    @Modifying
    @Query("UPDATE Product p SET p.active = false WHERE p.id = :id")
    void softDelete(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id AND p.active = true")
    Optional<Product> findByIdAndActiveTrueWithLock(Long id);
}
