package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.entity.CuttingSheet;
import com.backend.cuttingsheet.entity.OF;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/ofs")
public interface IOFApi {
    @PostMapping
    List<OF> createOF(@RequestBody Map<String, Object> payload);

    @PutMapping("/{id}")
    OF updateOF(@PathVariable Long id, @RequestBody String jsonPayload);

    @GetMapping("/{id}")
    OF getOFById(@PathVariable Long id);

    @GetMapping
    List<OF> getAllOFs();

    @DeleteMapping("/{id}")
    void deleteOF(@PathVariable Long id);

    @GetMapping("/search")
    List<OF> searchOFs(@RequestParam(value = "data", required = false) String data);

    @PostMapping("/check-duplicates")
    Map<String, Object> checkDuplicates(@RequestBody List<Map<String, String>> rows);
    @GetMapping("/cuttingSheets/search/byArticleAndProgram")
    List<CuttingSheet> findCuttingSheetsByArticleAndProgram(@RequestParam("article") String article, @RequestParam("program") String program);
}
