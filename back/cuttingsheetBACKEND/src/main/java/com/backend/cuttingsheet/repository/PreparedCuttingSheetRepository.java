package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.PreparedCuttingSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PreparedCuttingSheetRepository extends JpaRepository<PreparedCuttingSheet, Long> {
    Optional<PreparedCuttingSheet> findByOfIdAndArticle(Long ofId, String article);

    @Query("SELECT pcs FROM PreparedCuttingSheet pcs JOIN pcs.of o WHERE LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :orderNumber, '%'))")
    List<PreparedCuttingSheet> findByOrderNumberContaining(@Param("orderNumber") String orderNumber);
}