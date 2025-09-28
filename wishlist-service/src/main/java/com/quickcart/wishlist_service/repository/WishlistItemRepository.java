package com.quickcart.wishlist_service.repository;

import com.quickcart.wishlist_service.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @Modifying
    @Query("DELETE FROM WishlistItem wi WHERE wi.id = :itemId AND wi.wishlist.userId = :userId")
    int deleteByIdAndWishlist_UserId(@Param("itemId") Long itemId, @Param("userId") Long userId);

    Optional<WishlistItem> findByWishlist_UserIdAndId(Long userId, Long itemId);

    boolean existsByWishlist_IdAndProductId(Long wishlistId, Long productId);

    int countByWishlist_Id(Long wishlistId);
}
