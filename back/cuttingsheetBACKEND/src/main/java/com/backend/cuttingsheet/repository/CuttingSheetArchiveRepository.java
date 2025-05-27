package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.CuttingSheetArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CuttingSheetArchiveRepository extends JpaRepository<CuttingSheetArchive, Long> {
    @Query("SELECT a FROM CuttingSheetArchive a " +
           "JOIN FETCH a.of o " +
           "WHERE (:article IS NULL OR LOWER(a.article) LIKE LOWER(CONCAT('%', :article, '%'))) " +
           "AND (:ofValue IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :ofValue, '%'))) " +
           "AND (:program IS NULL OR LOWER(o.programme) LIKE LOWER(CONCAT('%', :program, '%'))) " +
           "AND (:serialNumber IS NULL OR a.serialNumber LIKE CONCAT('%', :serialNumber, '%')) " +
           "AND (:printedBy IS NULL OR LOWER(a.printedBy.firstName) LIKE LOWER(CONCAT('%', :printedBy, '%')) OR LOWER(a.printedBy.lastName) LIKE LOWER(CONCAT('%', :printedBy, '%'))) " +
           "AND (:startDate IS NULL OR a.printedAt >= :startDate) " +
           "AND (:endDate IS NULL OR a.printedAt <= :endDate)")
    List<CuttingSheetArchive> findByFilters(
            @Param("article") String article,
            @Param("ofValue") String ofValue,
            @Param("program") String program,
            @Param("serialNumber") String serialNumber,
            @Param("printedBy") String printedBy,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}