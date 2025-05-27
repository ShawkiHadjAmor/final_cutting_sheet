package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.LaunchedCuttingSheetDTO;
import com.backend.cuttingsheet.entity.LaunchedCuttingSheet;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/launchedCuttingSheets")
public interface ILaunchedCuttingSheetApi {
    @PostMapping
    LaunchedCuttingSheet createLaunchedCuttingSheet(@RequestBody Map<String, String> payload);

    @GetMapping("/{id}")
    LaunchedCuttingSheet getLaunchedCuttingSheetById(@PathVariable Long id);

    @GetMapping
    List<LaunchedCuttingSheet> getAllLaunchedCuttingSheets();

    @GetMapping("/ordo/{ordoId}")
    List<LaunchedCuttingSheet> getLaunchedCuttingSheetsByOrdoId(@PathVariable Long ordoId);

    @GetMapping("/with-ordos")
    List<LaunchedCuttingSheetDTO> getAllLaunchedCuttingSheetsWithOrdos();

    @DeleteMapping("/{id}")
    void deleteLaunchedCuttingSheet(@PathVariable Long id);
}