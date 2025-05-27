package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.entity.Program;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RequestMapping("/api/programs")
public interface IProgramApi {
    @PostMapping(consumes = "multipart/form-data")
    Program createProgram(
        @RequestPart("name") String name,
        @RequestPart(value = "image", required = false) MultipartFile image,
        @RequestPart("extractionRule") String extractionRule
    ) throws IOException;

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    Program updateProgram(
        @PathVariable Long id,
        @RequestPart("name") String name,
        @RequestPart(value = "image", required = false) MultipartFile image,
        @RequestPart("extractionRule") String extractionRule
    ) throws IOException;

    @GetMapping("/{id}")
    Program getProgramById(@PathVariable Long id);

    @GetMapping
    List<Program> getAllPrograms();

    @DeleteMapping("/{id}")
    void deleteProgram(@PathVariable Long id);

    @GetMapping("/search")
    List<Program> searchProgramsByName(@RequestParam String name);
}