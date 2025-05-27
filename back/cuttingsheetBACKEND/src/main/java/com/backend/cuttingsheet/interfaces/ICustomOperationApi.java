package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.entity.CustomOperation;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/custom-operations")
public interface ICustomOperationApi {
    @PostMapping
    CustomOperation createCustomOperation(@RequestBody String jsonPayload);

    @PutMapping("/{id}")
    CustomOperation updateCustomOperation(@PathVariable Long id, @RequestBody String jsonPayload);

    @GetMapping("/{id}")
    CustomOperation getCustomOperationById(@PathVariable Long id);

    @GetMapping
    List<CustomOperation> getAllCustomOperations();

    @DeleteMapping("/{id}")
    void deleteCustomOperation(@PathVariable Long id);

    @GetMapping("/search")
    List<CustomOperation> searchCustomOperationsByName(@RequestParam String name);
}