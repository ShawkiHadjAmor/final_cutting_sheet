package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.PreparedCuttingSheetDTO;
import com.backend.cuttingsheet.entity.PreparedCuttingSheet;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/preparedCuttingSheets")
public interface IPreparedCuttingSheetApi {
    @PostMapping
    PreparedCuttingSheet createPreparedCuttingSheet(@RequestBody Map<String, String> payload);

    @GetMapping("/{id}")
    PreparedCuttingSheet getPreparedCuttingSheetById(@PathVariable Long id);

    @GetMapping
    List<PreparedCuttingSheet> getAllPreparedCuttingSheets();

    @GetMapping("/ordo/{ordoId}")
    List<PreparedCuttingSheet> getPreparedCuttingSheetsByOrdoId(@PathVariable Long ordoId);

    @GetMapping("/with-ordos")
    List<PreparedCuttingSheetDTO> getAllPreparedCuttingSheetsWithOrdos();

    @PutMapping("/{id}/preparation-time")
    PreparedCuttingSheet updatePreparationTime(@PathVariable Long id, @RequestBody Map<String, Long> payload);

    @GetMapping("/search")
    List<PreparedCuttingSheetDTO> searchByOrderNumber(@RequestParam("orderNumber") String orderNumber);
}