package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.dto.CuttingSheetArchiveDTO;
import com.backend.cuttingsheet.entity.CuttingSheetArchive;
import com.backend.cuttingsheet.entity.ReprintEvent;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.ICuttingSheetArchiveApi;
import com.backend.cuttingsheet.repository.CuttingSheetArchiveRepository;
import com.backend.cuttingsheet.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cuttingSheetArchive")
public class CuttingSheetArchiveController implements ICuttingSheetArchiveApi {
    private static final Logger logger = LoggerFactory.getLogger(CuttingSheetArchiveController.class);

    @Autowired
    private CuttingSheetArchiveRepository repository;

    @Autowired
    private UserRepository userRepository;
    
    
 
    @Override
    @Transactional(readOnly = true)
    public List<CuttingSheetArchiveDTO> getAllArchivedCuttingSheets(
            String article,
            String ofValue,
            String program,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || (!user.hasRole("QUALITY") && !user.hasRole("CML"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only QUALITY or CML role can access archived cutting sheets");
        }

        List<CuttingSheetArchive> archives = repository.findByFilters(
                article != null && !article.isEmpty() ? article : null,
                ofValue != null && !ofValue.isEmpty() ? ofValue : null, // Corrected to use ofValue
                program != null && !program.isEmpty() ? program : null,
                null, // serialNumber
                null, // printedBy
                startDate,
                endDate
        );
        List<CuttingSheetArchiveDTO> dtos = archives.stream()
                .map(CuttingSheetArchiveDTO::new)
                .collect(Collectors.toList());
        logger.info("Retrieved {} archived cutting sheets", dtos.size());
        return dtos;
    }

    @Override
    @Transactional
    public void reprintCuttingSheet(Long id, Map<String, String> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || (!user.hasRole("QUALITY") && !user.hasRole("CML"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only QUALITY or CML role can reprint archived cutting sheets");
        }

        if (!payload.containsKey("reprintReason") || payload.get("reprintReason").trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reprint reason is required");
        }

        CuttingSheetArchive archive = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Archived cutting sheet not found"));

        ReprintEvent event = new ReprintEvent();
        event.setReason(payload.get("reprintReason"));
        event.setReprintedBy(user);
        event.setReprintedAt(LocalDateTime.now());
        event.setArchive(archive);
        
        archive.getReprintEvents().add(event);
        repository.save(archive);
        logger.info("Added reprint event for archived cutting sheet ID: {}", id);
    }

    @PutMapping("/{id}/preparation-time")
    @Transactional
    public void updatePreparationTime(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || (!user.hasRole("QUALITY") && !user.hasRole("CML"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only QUALITY or CML role can update preparation time");
        }

        if (!payload.containsKey("preparationTime")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preparation time is required");
        }

        CuttingSheetArchive archive = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Archived cutting sheet not found"));

        archive.setPreparationTime(payload.get("preparationTime"));
        repository.save(archive);
        logger.info("Updated preparation time for archived cutting sheet ID: {}", id);
    }
}