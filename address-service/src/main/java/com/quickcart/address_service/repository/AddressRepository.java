package com.quickcart.address_service.repository;

import com.quickcart.address_service.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    Optional<Address> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);
    List<Address> findByUserIdAndIsDefault(Long userId, boolean isDefault);

    @Query("SELECT a FROM Address a WHERE a.userId = :userId AND a.deleted = false")
    List<Address> findActiveByUserId(Long userId);
}