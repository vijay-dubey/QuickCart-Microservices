package com.quickcart.cart_service.repository;

import com.quickcart.cart_service.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCart_IdAndProductId(Long cartId, Long productId);

    Optional<CartItem> findByCart_IdAndId(Long cartId, Long itemId);

    @Query("SELECT COALESCE(SUM(ci.quantity), 0) FROM CartItem ci WHERE ci.productId = :productId AND ci.cart.id = :cartId")
    int sumQuantityByProductAndCart(@Param("productId") Long productId, @Param("cartId") Long cartId);

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.id = :itemId AND ci.cart.userId = :userId")
    int deleteByIdAndCartUser_Id(@Param("itemId") Long itemId, @Param("userId") Long userId);

    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.userId = :userId AND ci.id = :itemId")
    Optional<CartItem> findByCartUserIdAndId(@Param("userId") Long userId, @Param("itemId") Long itemId);

    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cart.id = :cartId")
    int countByCartId(@Param("cartId") Long cartId);
}
