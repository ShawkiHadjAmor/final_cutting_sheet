package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.SerialNumber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SerialNumberRepository extends JpaRepository<SerialNumber, Long> {
    Optional<SerialNumber> findBySerialNumberFrom(String serialNumberFrom);

    @Query("SELECT sn FROM SerialNumber sn " +
           "WHERE (:programId IS NULL OR sn.program.id = :programId) " +
           "AND (:article IS NULL OR LOWER(sn.article) LIKE LOWER(CONCAT('%', :article, '%'))) " +
           "AND (:orderNumber IS NULL OR (sn.of IS NOT NULL AND LOWER(sn.of.orderNumber) LIKE LOWER(CONCAT('%', :orderNumber, '%')))) " +
           "AND (:createdAt IS NULL OR sn.createdAt >= :createdAt AND sn.createdAt < :createdAtEnd)")
    List<SerialNumber> searchSerialNumbers(
        @Param("programId") Long programId,
        @Param("article") String article,
        @Param("orderNumber") String orderNumber,
        @Param("createdAt") LocalDateTime createdAt,
        @Param("createdAtEnd") LocalDateTime createdAtEnd
    );

    @Query("SELECT COALESCE(MAX(sn.serialNumberTo), '0') FROM SerialNumber sn WHERE sn.program.id = :programId AND sn.article = :article")
    String findMaxSerialNumberToByProgramIdAndArticle(
        @Param("programId") Long programId,
        @Param("article") String article
    );

    @Query("SELECT MAX(sn.increment) FROM SerialNumber sn WHERE sn.program.id = :programId AND sn.article = :article")
    Long findMaxIncrementByProgramIdAndArticle(
        @Param("programId") Long programId,
        @Param("article") String article
    );
}