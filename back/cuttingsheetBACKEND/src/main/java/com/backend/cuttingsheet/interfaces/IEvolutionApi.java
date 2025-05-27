package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.EvolutionDTO;
import com.backend.cuttingsheet.entity.ArticleIncrement;
import com.backend.cuttingsheet.entity.Program;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api/evolutions")
public interface IEvolutionApi {
    @PostMapping
    EvolutionDTO createEvolution(@RequestBody EvolutionDTO payload);

    @PutMapping("/{id}/ordo")
    EvolutionDTO updateEvolutionByOrdo(@PathVariable Long id, @RequestBody EvolutionDTO payload);

    @PutMapping("/{id}/quality")
    EvolutionDTO updateEvolutionByQuality(@PathVariable Long id, @RequestBody EvolutionDTO payload);

    @PutMapping("/{id}/close")
    EvolutionDTO closeEvolution(@PathVariable Long id);

    @PutMapping("/{id}/resolve")
    EvolutionDTO resolveEvolution(@PathVariable Long id);

    @GetMapping("/active")
    List<EvolutionDTO> getActiveEvolutions();

    @GetMapping("/program/{programId}/article-increments")
    List<ArticleIncrement> getArticleIncrementsByProgram(@PathVariable Long programId);

    @GetMapping("/program/{id}")
    Program getProgramDetails(@PathVariable Long id);

    @GetMapping("/search-programs")
    List<Map<String, Object>> searchPrograms(@RequestParam(value = "query", required = false) String query);

    @GetMapping("/program/{programId}/article/{article}/increment")
    Map<String, Object> getArticleIncrementWithEvolution(@PathVariable Long programId, @PathVariable String article);

    @GetMapping("/program/{programId}/articles")
    List<String> getArticlesByProgram(@PathVariable Long programId);
}