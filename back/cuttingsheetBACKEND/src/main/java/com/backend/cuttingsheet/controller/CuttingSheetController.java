package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.dto.CuttingSheetDTO;
import com.backend.cuttingsheet.dto.ProgramDTO;
import com.backend.cuttingsheet.entity.CuttingSheet;
import com.backend.cuttingsheet.entity.CustomOperation;
import com.backend.cuttingsheet.entity.Program;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.ICuttingSheetApi;
import com.backend.cuttingsheet.repository.CuttingSheetRepository;
import com.backend.cuttingsheet.repository.CustomOperationRepository;
import com.backend.cuttingsheet.repository.ProgramRepository;
import com.backend.cuttingsheet.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class CuttingSheetController implements ICuttingSheetApi {
    private static final Logger logger = LoggerFactory.getLogger(CuttingSheetController.class);

    @Autowired
    private CuttingSheetRepository repository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private CustomOperationRepository customOperationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private CuttingSheetDTO toDTO(CuttingSheet cuttingSheet) {
        CuttingSheetDTO dto = new CuttingSheetDTO();
        dto.setId(cuttingSheet.getId());
        dto.setArticle(cuttingSheet.getArticle());
        if (cuttingSheet.getProgram() != null) {
            ProgramDTO programDTO = new ProgramDTO();
            programDTO.setId(cuttingSheet.getProgram().getId());
            programDTO.setName(cuttingSheet.getProgram().getName());
            programDTO.setImagePath(cuttingSheet.getProgram().getImagePath());
            programDTO.setExtractionRule(cuttingSheet.getProgram().getExtractionRule());
            dto.setProgram(programDTO);
        }
        dto.setIndice(cuttingSheet.getIndice());
        dto.setType(cuttingSheet.getType());
        dto.setHasSerialNumber(cuttingSheet.isHasSerialNumber());
        dto.setOperationsJson(cuttingSheet.getOperationsJson());
        if (cuttingSheet.getCustomOperations() != null) {
            dto.setCustomOperationIds(
                cuttingSheet.getCustomOperations().stream()
                    .map(CustomOperation::getId)
                    .collect(Collectors.toList())
            );
        } else {
            dto.setCustomOperationIds(new ArrayList<>());
        }
        dto.setRevisionHistory(cuttingSheet.getRevisionHistory());
        dto.setCreatedBy(cuttingSheet.getCreatedBy() != null ? cuttingSheet.getCreatedBy().getFirstName() : null);
        dto.setCreatedAt(cuttingSheet.getCreatedAt());
        return dto;
    }

    private String getRequiredField(JsonNode jsonNode, String fieldName) {
        if (!jsonNode.has(fieldName) || jsonNode.get(fieldName).isNull() || jsonNode.get(fieldName).asText().isEmpty()) {
            throw new IllegalArgumentException("Field '" + fieldName + "' is required");
        }
        return jsonNode.get(fieldName).asText();
    }

    private void validateCuttingSheet(CuttingSheet cuttingSheet) {
        if (cuttingSheet.getArticle() == null || cuttingSheet.getArticle().isEmpty()) {
            throw new IllegalArgumentException("Article is required");
        }
        if (cuttingSheet.getProgram() == null) {
            throw new IllegalArgumentException("Program is required");
        }
        if (cuttingSheet.getIndice() == null || cuttingSheet.getIndice().isEmpty()) {
            throw new IllegalArgumentException("Indice is required");
        }
        if (cuttingSheet.getType() == null || !CuttingSheet.ALLOWED_TYPES.contains(cuttingSheet.getType().toLowerCase())) {
            throw new IllegalArgumentException("Type must be one of: " + CuttingSheet.ALLOWED_TYPES);
        }
    }

    @Override
    @Transactional
    public CuttingSheetDTO createCuttingSheet(String jsonPayload) {
        logger.debug("Processing POST /api/cuttingSheets with payload: {}", jsonPayload);
        if (jsonPayload == null || jsonPayload.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload cannot be null or empty");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can create cutting sheets");
        }
        CuttingSheet cuttingSheet = new CuttingSheet();
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonPayload);
            cuttingSheet.setArticle(getRequiredField(jsonNode, "article"));
            Long programId = jsonNode.get("program").asLong();
            Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Program not found with id " + programId));
            cuttingSheet.setProgram(program);
            cuttingSheet.setIndice(getRequiredField(jsonNode, "indice"));
            cuttingSheet.setType(getRequiredField(jsonNode, "type"));
            cuttingSheet.setHasSerialNumber(jsonNode.has("hasSerialNumber") ? jsonNode.get("hasSerialNumber").asBoolean() : false);
            JsonNode operationsNode = jsonNode.get("operations");
            cuttingSheet.setOperationsJson(
                operationsNode != null && operationsNode.isArray() && !operationsNode.isEmpty()
                    ? objectMapper.writeValueAsString(operationsNode)
                    : "[]"
            );
            JsonNode customOperationsNode = jsonNode.get("customOperations");
            List<CustomOperation> customOperations = new ArrayList<>();
            if (customOperationsNode != null && customOperationsNode.isArray()) {
                for (JsonNode customOpIdNode : customOperationsNode) {
                    Long customOpId = customOpIdNode.asLong();
                    CustomOperation customOperation = customOperationRepository.findById(customOpId)
                        .orElseThrow(() -> new IllegalArgumentException("Custom operation not found with id " + customOpId));
                    customOperations.add(customOperation);
                }
            }
            cuttingSheet.setCustomOperations(customOperations);
            Map<String, Map<String, String>> revisionHistory = new HashMap<>();
            Map<String, String> initialRevision = new HashMap<>();
            String createdBy = user.getFirstName();
            initialRevision.put("createdBy", createdBy);
            initialRevision.put("createdAt", LocalDateTime.now().toString());
            initialRevision.put("updatedAt", null);
            initialRevision.put("object", "Created");
            initialRevision.put("verifiedBy", null);
            initialRevision.put("updatedBy", null);
            revisionHistory.put(cuttingSheet.getIndice(), initialRevision);
            cuttingSheet.setRevisionHistory(objectMapper.writeValueAsString(revisionHistory));
            cuttingSheet.setCreatedBy(user);
            cuttingSheet.setCreatedAt(LocalDateTime.now());
            validateCuttingSheet(cuttingSheet);
        } catch (Exception e) {
            logger.error("Error creating cutting sheet: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to process payload: " + e.getMessage());
        }
        CuttingSheet savedSheet = repository.save(cuttingSheet);
        logger.info("Created cutting sheet ID: {}", savedSheet.getId());
        return toDTO(savedSheet);
    }

    @Override
    @Transactional
    public CuttingSheetDTO updateCuttingSheet(Long id, String jsonPayload) {
        CuttingSheet cuttingSheet = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cutting sheet not found"));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can update cutting sheets");
        }
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonPayload);
            cuttingSheet.setArticle(getRequiredField(jsonNode, "article"));
            Long programId = jsonNode.get("program").asLong();
            Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Program not found with id " + programId));
            cuttingSheet.setProgram(program);
            String newIndice = getRequiredField(jsonNode, "indice");
            cuttingSheet.setIndice(newIndice);
            cuttingSheet.setType(getRequiredField(jsonNode, "type"));
            cuttingSheet.setHasSerialNumber(jsonNode.has("hasSerialNumber") ? jsonNode.get("hasSerialNumber").asBoolean() : false);
            JsonNode operationsNode = jsonNode.get("operations");
            cuttingSheet.setOperationsJson(
                operationsNode != null && operationsNode.isArray() && !operationsNode.isEmpty()
                    ? objectMapper.writeValueAsString(operationsNode)
                    : "[]"
            );
            JsonNode customOperationsNode = jsonNode.get("customOperations");
            List<CustomOperation> newCustomOperations = new ArrayList<>();
            if (customOperationsNode != null && customOperationsNode.isArray()) {
                for (JsonNode customOpIdNode : customOperationsNode) {
                    Long customOpId = customOpIdNode.asLong();
                    CustomOperation customOperation = customOperationRepository.findById(customOpId)
                        .orElseThrow(() -> new IllegalArgumentException("Custom operation not found with id " + customOpId));
                    newCustomOperations.add(customOperation);
                }
            }
            List<CustomOperation> existingCustomOperations = cuttingSheet.getCustomOperations();
            if (existingCustomOperations != null) {
                for (CustomOperation customOp : existingCustomOperations) {
                    if (!newCustomOperations.contains(customOp)) {
                        customOp.getCuttingSheets().remove(cuttingSheet);
                    }
                }
            }
            cuttingSheet.setCustomOperations(newCustomOperations);
            Map<String, Map<String, String>> revisionHistory = cuttingSheet.getRevisionHistory() != null
                ? objectMapper.readValue(cuttingSheet.getRevisionHistory(), Map.class)
                : new HashMap<>();
            Map<String, String> newRevision = new HashMap<>();
            String updatedBy = user.getFirstName();
            newRevision.put("updatedBy", updatedBy);
            newRevision.put("updatedAt", LocalDateTime.now().toString());
            newRevision.put("object", jsonNode.has("revisionObject") ? jsonNode.get("revisionObject").asText("Updated") : "Updated");
            newRevision.put("createdBy", revisionHistory.getOrDefault(cuttingSheet.getIndice(), new HashMap<>()).getOrDefault("createdBy", user.getFirstName()));
            newRevision.put("createdAt", revisionHistory.getOrDefault(cuttingSheet.getIndice(), new HashMap<>()).getOrDefault("createdAt", LocalDateTime.now().toString()));
            newRevision.put("verifiedBy", null);
            revisionHistory.put(newIndice, newRevision);
            cuttingSheet.setRevisionHistory(objectMapper.writeValueAsString(revisionHistory));
            validateCuttingSheet(cuttingSheet);
        } catch (Exception e) {
            logger.error("Error updating cutting sheet ID {}: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to process payload: " + e.getMessage());
        }
        CuttingSheet updatedSheet = repository.save(cuttingSheet);
        logger.info("Updated cutting sheet ID: {}", updatedSheet.getId());
        return toDTO(updatedSheet);
    }

    @Override
    public CuttingSheetDTO getCuttingSheetById(Long id) {
        CuttingSheet sheet = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cutting sheet not found"));
        logger.info("Retrieved cutting sheet ID: {}", id);
        return toDTO(sheet);
    }

    @Override
    public List<CuttingSheetDTO> getCuttingSheetByArticle(String article) {
        logger.info("Querying cutting sheets for article: '{}'", article);
        // Trim the input article before querying
        String trimmedArticle = article != null ? article.trim() : null;
        if (trimmedArticle == null || trimmedArticle.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article cannot be null or empty");
        }
        List<CuttingSheet> sheets = repository.findByArticleContainingIgnoreCase(trimmedArticle);
        logger.info("Retrieved {} cutting sheets for article: '{}'", sheets.size(), trimmedArticle);
        return sheets.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<CuttingSheetDTO> searchByArticleContain(String article) {
        logger.info("Searching cutting sheets containing article: '{}'", article);
        List<CuttingSheet> sheets = repository.findByArticleContainingIgnoreCase(article);
        logger.info("Search by article containing '{}': {} results", article, sheets.size());
        return sheets.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<CuttingSheetDTO> getAllCuttingSheets() {
        List<CuttingSheet> sheets = repository.findAll();
        logger.info("Retrieved {} cutting sheets", sheets.size());
        return sheets.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteCuttingSheet(Long id) {
        CuttingSheet sheet = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cutting sheet not found"));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if  (user == null || !user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can delete cutting sheets");
        }
        List<CustomOperation> customOperations = sheet.getCustomOperations();
        if (customOperations != null) {
            for (CustomOperation customOp : customOperations) {
                customOp.getCuttingSheets().remove(sheet);
            }
        }
        repository.delete(sheet);
        logger.info("Deleted cutting sheet ID: {}", id);
    }

    @Override
    public List<CuttingSheetDTO> searchCuttingSheets(String program, String article, String type) {
        logger.info("Search cutting sheets - program: {}, article: {}, type: {}", program, article, type);
        List<CuttingSheet> sheets = repository.searchCuttingSheets(program, article, type);
        logger.info("Search results: {} cutting sheets", sheets.size());
        return sheets.stream().map(this::toDTO).collect(Collectors.toList());
    }
    
    @GetMapping("/eligibleArticles")
    public List<String> getEligibleArticlesForProgram(@RequestParam Long programId) {
        return repository.findEligibleArticlesForProgram(programId);
    }
}