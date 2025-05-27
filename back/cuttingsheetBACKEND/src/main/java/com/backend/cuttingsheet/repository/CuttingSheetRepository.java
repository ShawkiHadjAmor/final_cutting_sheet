package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.CuttingSheet;
import com.backend.cuttingsheet.entity.Program;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuttingSheetRepository extends JpaRepository<CuttingSheet, Long> {

    // Replace findByArticleIgnoreCaseAndTrim with a custom query
    @Query("SELECT cs FROM CuttingSheet cs WHERE TRIM(UPPER(cs.article)) = TRIM(UPPER(:article))")
    List<CuttingSheet> findByArticleIgnoreCaseAndTrim(@Param("article") String article);

    List<CuttingSheet> findByArticleContainingIgnoreCase(String article);

    @Query("SELECT cs FROM CuttingSheet cs LEFT JOIN FETCH cs.program p " +
           "WHERE (:program IS NULL OR p.name LIKE %:program%) " +
           "AND (:article IS NULL OR cs.article LIKE %:article%) " +
           "AND (:type IS NULL OR cs.type = :type)")
    List<CuttingSheet> searchCuttingSheets(
            @Param("program") String program,
            @Param("article") String article,
            @Param("type") String type
    );
    Optional<CuttingSheet> findByArticle(String article);
    List<CuttingSheet> findByProgram(Program program);
    @Query("SELECT cs.article FROM CuttingSheet cs " +
            "WHERE cs.program.id = :programId " +
            "AND cs.hasSerialNumber = true " +
            "AND NOT EXISTS (SELECT ai FROM ArticleIncrement ai " +
            "                WHERE ai.programId = :programId " +
            "                AND ai.article = cs.article)")
     List<String> findEligibleArticlesForProgram(@Param("programId") Long programId);
    @Query("SELECT cs FROM CuttingSheet cs WHERE TRIM(UPPER(cs.article)) = TRIM(UPPER(:article)) AND cs.program.name = :program")
    List<CuttingSheet> findByArticleAndProgramIgnoreCase(@Param("article") String article, @Param("program") String program);
}