package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.CuttingSheetArchiveDTO;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RequestMapping("/api/cuttingSheetArchive")
public interface ICuttingSheetArchiveApi {
    @GetMapping
    List<CuttingSheetArchiveDTO> getAllArchivedCuttingSheets(
            @RequestParam(required = false) String article,
            @RequestParam(required = false) String ofValue,
            @RequestParam(required = false) String program,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
 );
    @PostMapping("/reprint/{id}")
    void reprintCuttingSheet(@PathVariable Long id, @RequestBody Map<String, String> payload);
}