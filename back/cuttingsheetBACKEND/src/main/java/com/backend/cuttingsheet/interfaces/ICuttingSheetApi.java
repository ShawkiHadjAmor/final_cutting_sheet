package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.CuttingSheetDTO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/cuttingSheets")
public interface ICuttingSheetApi {
    @PostMapping
    CuttingSheetDTO createCuttingSheet(@RequestBody String jsonPayload);

    @GetMapping("/{id}")
    CuttingSheetDTO getCuttingSheetById(@PathVariable Long id);

    @GetMapping("/search/byArticle")
    List<CuttingSheetDTO> getCuttingSheetByArticle(@RequestParam String article);

    @GetMapping("/search/contain")
    List<CuttingSheetDTO> searchByArticleContain(@RequestParam String article);

    @GetMapping
    List<CuttingSheetDTO> getAllCuttingSheets();

    @PutMapping("/{id}")
    CuttingSheetDTO updateCuttingSheet(@PathVariable Long id, @RequestBody String jsonPayload);

    @DeleteMapping("/{id}")
    void deleteCuttingSheet(@PathVariable Long id);

    @GetMapping("/search")
    List<CuttingSheetDTO> searchCuttingSheets(
            @RequestParam(value = "program", required = false) String program,
            @RequestParam(value = "article", required = false) String article,
            @RequestParam(value = "type", required = false) String type
    );
}