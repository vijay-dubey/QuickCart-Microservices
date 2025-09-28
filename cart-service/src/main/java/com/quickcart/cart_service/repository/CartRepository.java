package com.quickcart.cart_service.repository;

import com.quickcart.cart_service.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM Cart c WHERE c.id = :cartId")
    void deleteCartById(@Param("cartId") Long cartId);
}
