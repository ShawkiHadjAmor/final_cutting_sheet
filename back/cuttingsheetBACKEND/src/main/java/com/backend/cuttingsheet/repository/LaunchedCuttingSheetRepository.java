package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.LaunchedCuttingSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LaunchedCuttingSheetRepository extends JpaRepository<LaunchedCuttingSheet, Long> {
    Optional<LaunchedCuttingSheet> findByOfIdAndCuttingSheetId(Long ofId, Long cuttingSheetId);
}