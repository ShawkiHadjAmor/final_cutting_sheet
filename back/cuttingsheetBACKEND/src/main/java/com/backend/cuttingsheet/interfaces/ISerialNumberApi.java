package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.dto.SerialNumberResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/api")
public interface ISerialNumberApi {
    @PostMapping("/serial-numbers")
    ResponseEntity<Map<String, Object>> createSerialNumber(@RequestBody Map<String, Object> request);

    @GetMapping("/serial-numbers/{id}")
    SerialNumberResponseDTO getSerialNumberById(@PathVariable Long id);

    @GetMapping("/serial-numbers")
    List<SerialNumberResponseDTO> getAllSerialNumbers();

    @GetMapping("/serial-numbers/program/{programId}")
    List<SerialNumberResponseDTO> getSerialNumbersByProgram(@PathVariable Long programId);

    @DeleteMapping("/serial-numbers/{id}")
    void deleteSerialNumber(@PathVariable Long id);

    @PostMapping("/serial-numbers/search")
    ResponseEntity<List<SerialNumberResponseDTO>> searchSerialNumbers(@RequestBody Map<String, Object> request);

    @GetMapping("/serial-numbers/programs")
    ResponseEntity<List<Map<String, Object>>> getAllPrograms();
}