package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.Evolution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvolutionRepository extends JpaRepository<Evolution, Long> {
    List<Evolution> findByIsActiveTrue();
    List<Evolution> findByProgramIdAndIsActiveTrue(Long programId);
    List<Evolution> findByProgramIdAndArticleAndIsActiveTrue(Long programId, String article);
}