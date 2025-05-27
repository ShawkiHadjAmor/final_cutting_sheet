package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.CustomOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomOperationRepository extends JpaRepository<CustomOperation, Long> {
    Optional<CustomOperation> findByName(String name);

    @Query("SELECT co FROM CustomOperation co WHERE LOWER(co.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<CustomOperation> findByNameContainingIgnoreCase(@Param("name") String name);
}