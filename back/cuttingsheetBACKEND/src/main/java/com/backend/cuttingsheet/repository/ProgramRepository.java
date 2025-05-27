package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.Program;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    Optional<Program> findByName(String name);

    @Query("SELECT p FROM Program p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Program> findByNameContainingIgnoreCase(@Param("name") String name);

    @Query("SELECT p FROM Program p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.extractionRule) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Program> searchPrograms(@Param("query") String query);
}