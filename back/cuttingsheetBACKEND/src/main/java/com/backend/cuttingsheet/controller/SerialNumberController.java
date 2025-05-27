package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.dto.SerialNumberResponseDTO;
import com.backend.cuttingsheet.entity.OF;
import com.backend.cuttingsheet.entity.Program;
import com.backend.cuttingsheet.entity.SerialNumber;
import com.backend.cuttingsheet.entity.ArticleIncrement;
import com.backend.cuttingsheet.interfaces.ISerialNumberApi;
import com.backend.cuttingsheet.repository.OFRepository;
import com.backend.cuttingsheet.repository.ProgramRepository;
import com.backend.cuttingsheet.repository.SerialNumberRepository;
import com.backend.cuttingsheet.repository.ArticleIncrementRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class SerialNumberController implements ISerialNumberApi {
    private static final Logger logger = LoggerFactory.getLogger(SerialNumberController.class);

    @Autowired
    private SerialNumberRepository serialNumberRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private OFRepository ofRepository;

    @Autowired
    private ArticleIncrementRepository articleIncrementRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private SerialNumberResponseDTO mapToResponseDTO(SerialNumber serialNumber) {
        SerialNumberResponseDTO dto = new SerialNumberResponseDTO();
        dto.setId(serialNumber.getId());
        dto.setProgramName(serialNumber.getProgram().getName());
        dto.setSerialNumberFrom(serialNumber.getSerialNumberFrom());
        dto.setSerialNumberTo(serialNumber.getSerialNumberTo());
        dto.setPlan(serialNumber.getPlan());
        dto.setIndice(serialNumber.getIndice());
        dto.setArticle(serialNumber.getArticle());
        dto.setIncrement(serialNumber.getIncrement());
        dto.setCreatedAt(serialNumber.getCreatedAt());
        if (serialNumber.getOf() != null) {
            dto.setOfId(serialNumber.getOf().getId());
            dto.setOrderNumber(serialNumber.getOf().getOrderNumber());
            dto.setQuantity(serialNumber.getOf().getQuantity());
            dto.setArticle(serialNumber.getOf().getArticle());
            dto.setDate(serialNumber.getOf().getDate().toString());
            dto.setProgramme(serialNumber.getOf().getProgramme());
        }
        return dto;
    }

    private void validateExtractionRule(Program program) throws IOException {
        String extractionRule = program.getExtractionRule();
        if (extractionRule == null || extractionRule.trim().isEmpty()) {
            logger.error("Program must have a valid extraction rule for program ID: {}", program.getId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program must have a valid extraction rule");
        }
        JsonNode ruleNode = objectMapper.readTree(extractionRule);
        if (!ruleNode.has("zasypn") || !ruleNode.has("indice") || !ruleNode.has("snFormat")) {
            logger.error("Extraction rule missing zasypn, indice, or snFormat for program ID: {}", program.getId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Extraction rule missing zasypn, indice, or snFormat");
        }
    }

    private long extractQuantiteFromOF(OF of) {
        Integer quantity = of.getQuantity();
        if (quantity == null || quantity <= 0) {
            logger.warn("Quantity {} is not positive for OF ID {}, defaulting to 1", quantity, of.getId());
            return 1;
        }
        logger.info("Extracted quantity from OF ID {}: {}", of.getId(), quantity);
        return quantity.longValue();
    }

    @Override
    @Transactional
    public ResponseEntity<Map<String, Object>> createSerialNumber(Map<String, Object> request) {
        Long programId = Optional.ofNullable((Number) request.get("programId")).map(Number::longValue).orElse(null);
        String article = (String) request.get("article");
        Long ofId = Optional.ofNullable((Number) request.get("ofId")).map(Number::longValue).orElse(null);
        Long quantite = Optional.ofNullable((Number) request.get("quantite")).map(Number::longValue).orElse(null);

        logger.info("Creating serial number: programId={}, article={}, ofId={}, quantite={}",
                programId, article, ofId, quantite);

        if (programId == null) {
            logger.error("Program ID is missing in the request");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program ID is required");
        }
        if (article == null || article.trim().isEmpty()) {
            logger.error("Article is missing or empty in the request");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is required");
        }
        if (ofId == null) {
            logger.error("OF ID is missing in the request");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OF ID is required to create a serial number");
        }

        article = article.trim().toLowerCase();

        Program program = programRepository.findById(programId)
                .orElseThrow(() -> {
                    logger.error("Program not found for ID: {}", programId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found");
                });

        logger.debug("Fetching OF with ID: {}", ofId);
        OF of = ofRepository.findById(ofId)
                .orElseThrow(() -> {
                    logger.error("OF not found for ID: {}", ofId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "OF with ID " + ofId + " not found");
                });
        if (!of.getArticle().trim().toLowerCase().equals(article)) {
            logger.error("Article {} does not match OF article {}", article, of.getArticle());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article does not match OF article");
        }

        long finalQuantite;
        if (quantite != null && quantite > 0) {
            finalQuantite = quantite;
            logger.info("Using quantite from request: {}", finalQuantite);
        } else {
            finalQuantite = extractQuantiteFromOF(of);
            logger.info("Extracted quantite from OF: {}", finalQuantite);
        }

        try {
            validateExtractionRule(program);
            JsonNode ruleNode = objectMapper.readTree(program.getExtractionRule());
            String plan = ruleNode.get("zasypn").asText();
            String indice = ruleNode.get("indice").asText();
            String snFormat = ruleNode.get("snFormat").asText();

            List<SerialNumber> existing = serialNumberRepository.searchSerialNumbers(programId, article, null, null, null)
                .stream()
                .filter(sn -> sn.getOf() != null && sn.getOf().getId().equals(ofId))
                .collect(Collectors.toList());
            if (!existing.isEmpty()) {
                logger.error("Serial number already exists for programId={}, article={}, ofId={}", programId, article, ofId);
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Serial number already exists for this program, article, and OF");
            }

            long startingIncrement = 1;
            Optional<ArticleIncrement> articleIncrementOpt = articleIncrementRepository.findByProgramIdAndArticle(programId, article);
            if (articleIncrementOpt.isPresent()) {
                startingIncrement = articleIncrementOpt.get().getLastIncrement() + 1;
            }

            Long maxIncrement = serialNumberRepository.findMaxIncrementByProgramIdAndArticle(programId, article);
            if (maxIncrement != null && maxIncrement > 0) {
                startingIncrement = Math.max(startingIncrement, maxIncrement + 1);
            }

            long endIncrement = startingIncrement + finalQuantite;
            Map<String, String> serialNumberRange = generateUniqueSerialNumberRange(snFormat, plan, indice, startingIncrement, endIncrement);
            if (serialNumberRange == null || !serialNumberRange.containsKey("from") || !serialNumberRange.containsKey("to")) {
                logger.error("Failed to generate unique serial number range for programId={}, article={}, ofId={}", programId, article, ofId);
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Unable to generate unique serial number range");
            }

            SerialNumber serialNumber = new SerialNumber();
            serialNumber.setProgram(program);
            serialNumber.setSerialNumberFrom(serialNumberRange.get("from"));
            serialNumber.setSerialNumberTo(serialNumberRange.get("to"));
            serialNumber.setPlan(plan);
            serialNumber.setIndice(indice);
            serialNumber.setArticle(article);
            serialNumber.setOf(of);
            serialNumber.setReference(plan + "-" + article + "-" + program.getName());
            serialNumber.setIncrement(endIncrement);
            serialNumber.setCreatedAt(LocalDateTime.now());
            SerialNumber savedSerialNumber = serialNumberRepository.save(serialNumber);

            ArticleIncrement articleIncrement;
            if (articleIncrementOpt.isPresent()) {
                articleIncrement = articleIncrementOpt.get();
                articleIncrement.setLastIncrement(endIncrement);
            } else {
                articleIncrement = new ArticleIncrement();
                articleIncrement.setProgramId(programId);
                articleIncrement.setArticle(article);
                articleIncrement.setLastIncrement(endIncrement);
            }
            articleIncrementRepository.save(articleIncrement);
            logger.info("Updated article increment for programId={}, article={}, lastIncrement={}",
                    programId, article, endIncrement);

            logger.info("Created serial number range: {} to {} ID: {} with ofId: {}",
                    savedSerialNumber.getSerialNumberFrom(), savedSerialNumber.getSerialNumberTo(), savedSerialNumber.getId(), of.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("article", savedSerialNumber.getArticle());
            response.put("program", savedSerialNumber.getProgram().getName());
            response.put("serialNumberFrom", savedSerialNumber.getSerialNumberFrom());
            response.put("serialNumberTo", savedSerialNumber.getSerialNumberTo());
            response.put("of", savedSerialNumber.getOf().getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            logger.error("Invalid extraction rule for program {}: {}", program.getId(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid extraction rule: " + e.getMessage());
        }
    }

    private Map<String, String> generateUniqueSerialNumberRange(String snFormat, String plan, String indice, long startIncrement, long endIncrement) {
        Map<String, String> result = new HashMap<>();
        String startIncStr = String.valueOf(startIncrement);
        String endIncStr = String.valueOf(endIncrement);
        String serialNumberFrom;
        String serialNumberTo;

        switch (snFormat) {
            case "prefix-indice-increment":
                serialNumberFrom = plan + indice + startIncStr;
                serialNumberTo = plan + indice + endIncStr;
                break;
            case "increment-indice-prefix":
                serialNumberFrom = startIncStr + indice + plan;
                serialNumberTo = endIncStr + indice + plan;
                break;
            case "zasypn-increment-indice":
                serialNumberFrom = plan + startIncStr + indice;
                serialNumberTo = plan + endIncStr + indice;
                break;
            case "indice-increment-zasypn":
                serialNumberFrom = indice + startIncStr + plan;
                serialNumberTo = indice + endIncStr + plan;
                break;
            case "indice-zasypn-increment":
                serialNumberFrom = indice + plan + startIncStr;
                serialNumberTo = indice + plan + endIncStr;
                break;
            case "increment-zasypn-indice":
                serialNumberFrom = startIncStr + plan + indice;
                serialNumberTo = endIncStr + plan + indice;
                break;
            default:
                logger.error("Unsupported snFormat: {}", snFormat);
                throw new IllegalArgumentException("Unsupported snFormat: " + snFormat);
        }

        logger.debug("Generated serial number range: {} to {}", serialNumberFrom, serialNumberTo);
        result.put("from", serialNumberFrom);
        result.put("to", serialNumberTo);
        return result;
    }

    @Override
    public SerialNumberResponseDTO getSerialNumberById(Long id) {
        logger.info("Fetching serial number ID: {}", id);
        SerialNumber serialNumber = serialNumberRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Serial number not found for ID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Serial number not found");
                });
        return mapToResponseDTO(serialNumber);
    }

    @Override
    public List<SerialNumberResponseDTO> getAllSerialNumbers() {
        logger.info("Fetching all serial numbers");
        List<SerialNumber> serialNumbers = serialNumberRepository.findAll();
        logger.info("Retrieved {} serial numbers", serialNumbers.size());
        return serialNumbers.stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<SerialNumberResponseDTO> getSerialNumbersByProgram(Long programId) {
        logger.info("Fetching serial numbers for program ID: {}", programId);
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> {
                    logger.error("Program not found for ID: {}", programId);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found");
                });
        List<SerialNumber> serialNumbers = serialNumberRepository.findAll().stream()
                .filter(sn -> sn.getProgram().getId().equals(programId))
                .collect(Collectors.toList());
        logger.info("Retrieved {} serial numbers for program ID: {}", serialNumbers.size(), programId);
        return serialNumbers.stream().map(this::mapToResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSerialNumber(Long id) {
        logger.info("Deleting serial number ID: {}", id);
        SerialNumber serialNumber = serialNumberRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Serial number not found for ID: {}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Serial number not found");
                });
        serialNumberRepository.delete(serialNumber);
        logger.info("Deleted serial number ID: {}", id);
    }

    @Override
    public ResponseEntity<List<SerialNumberResponseDTO>> searchSerialNumbers(Map<String, Object> request) {
        Long programId = Optional.ofNullable((Number) request.get("programId")).map(Number::longValue).orElse(null);
        String article = Optional.ofNullable((String) request.get("article")).map(String::trim).map(String::toLowerCase).orElse(null);
        String orderNumber = Optional.ofNullable((String) request.get("orderNumber")).map(String::trim).map(String::toLowerCase).orElse(null);
        String createdAtStr = Optional.ofNullable((String) request.get("createdAt")).map(String::trim).orElse(null);
        Long ofId = Optional.ofNullable((Number) request.get("ofId")).map(Number::longValue).orElse(null);

        LocalDateTime createdAt = null;
        LocalDateTime createdAtEnd = null;
        if (createdAtStr != null && !createdAtStr.isEmpty()) {
            try {
                LocalDate date = LocalDate.parse(createdAtStr, DateTimeFormatter.ISO_LOCAL_DATE);
                createdAt = date.atStartOfDay();
                createdAtEnd = date.plusDays(1).atStartOfDay();
                logger.info("Parsed createdAt: {}, createdAtEnd: {}", createdAt, createdAtEnd);
            } catch (DateTimeParseException e) {
                logger.warn("Invalid createdAt format: {}. Ignoring createdAt filter.", createdAtStr);
            }
        }

        logger.info("Searching serial numbers: programId={}, article={}, orderNumber={}, createdAt={}, ofId={}",
                    programId, article, orderNumber, createdAt, ofId);

        List<SerialNumber> serialNumbers;
        try {
            if (ofId != null) {
                serialNumbers = serialNumberRepository.searchSerialNumbers(programId, article, null, createdAt, createdAtEnd)
                    .stream()
                    .filter(sn -> sn.getOf() != null && sn.getOf().getId().equals(ofId))
                    .collect(Collectors.toList());
            } else {
                serialNumbers = serialNumberRepository.searchSerialNumbers(programId, article, orderNumber, createdAt, createdAtEnd);
                if (orderNumber != null && !serialNumbers.isEmpty()) {
                    logger.debug("Found {} serial numbers for orderNumber: {}", serialNumbers.size(), orderNumber);
                    logger.debug("Sample orderNumbers in results: {}",
                            serialNumbers.stream()
                                    .filter(sn -> sn.getOf() != null)
                                    .map(sn -> sn.getOf().getOrderNumber())
                                    .limit(5)
                                    .collect(Collectors.joining(", ")));
                } else if (orderNumber != null) {
                    logger.info("No serial numbers found for orderNumber: {}", orderNumber);
                }
            }
        } catch (Exception e) {
            logger.error("Error executing search query: {}", e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<SerialNumberResponseDTO> response = serialNumbers.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());

        logger.info("Found {} serial numbers", response.size());
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<List<Map<String, Object>>> getAllPrograms() {
        logger.info("Fetching all programs");
        List<Program> programs = programRepository.findAll();
        List<Map<String, Object>> response = programs.stream().map(program -> {
            Map<String, Object> programMap = new HashMap<>();
            programMap.put("id", program.getId());
            programMap.put("name", program.getName());
            return programMap;
        }).collect(Collectors.toList());
        logger.info("Retrieved {} programs", response.size());
        return ResponseEntity.ok(response);
    }
}