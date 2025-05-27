package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.entity.*;
import com.backend.cuttingsheet.interfaces.IOFApi;
import com.backend.cuttingsheet.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
public class OFController implements IOFApi {
    private static final Logger logger = LoggerFactory.getLogger(OFController.class);

    @Autowired
    private OFRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EvolutionRepository evolutionRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private ArticleIncrementRepository articleIncrementRepository;
    @Autowired
    private CuttingSheetRepository cuttingSheetRepository;	

    @Autowired
    private ObjectMapper objectMapper;

    private String getRequiredField(JsonNode jsonNode, String fieldName) {
        if (!jsonNode.has(fieldName) || jsonNode.get(fieldName).isNull() || jsonNode.get(fieldName).asText().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Field '" + fieldName + "' is required");
        }
        return jsonNode.get(fieldName).asText().trim();
    }

    private void validateOF(OF of) {
        if (of.getOrderNumber() == null || of.getOrderNumber().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order number is required");
        }
        if (of.getQuantity() == null || of.getQuantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive");
        }
        if (of.getArticle() == null || of.getArticle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is required");
        }
        if (of.getDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date is required");
        }
        if (of.getProgramme() == null || of.getProgramme().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Programme is required");
        }
        if (of.getCreatedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Created at timestamp is required");
        }
    }

    @Override
    @Transactional
    public List<OF> createOF(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("rows") || !payload.containsKey("articles")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload must contain 'rows' and 'articles'");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can create OFs");
        }

        List<Map<String, Object>> rows = (List<Map<String, Object>>) payload.get("rows");
        List<Map<String, Object>> articles = (List<Map<String, Object>>) payload.get("articles");
        Boolean skipDuplicates = (Boolean) payload.getOrDefault("skipDuplicates", false);

        if (rows == null || rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rows cannot be null or empty");
        }
        if (articles == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Articles cannot be null");
        }

        List<OF> createdOFs = new ArrayList<>();
        List<Map<String, String>> blockedByEvolutions = new ArrayList<>();
        int duplicateRows = 0;
        int totalRows = rows.size();

        try {
            for (int i = 0; i < rows.size(); i++) {
                Map<String, Object> row = rows.get(i);
                String orderNumber = (String) row.get("orderNumber");
                Object quantityObj = row.get("quantity");
                String article = ((String) row.get("article")) != null ? ((String) row.get("article")).trim().toLowerCase() : null;
                String dateStr = (String) row.get("date");
                String programme = (String) row.get("programme");
                String rowIndex = String.valueOf(row.get("rowIndex"));
                String increment = (String) row.get("increment");

                if (orderNumber == null || orderNumber.trim().isEmpty() || article == null || article.isEmpty() ||
                    quantityObj == null || dateStr == null || dateStr.trim().isEmpty() ||
                    programme == null || programme.trim().isEmpty()) {
                    logger.warn("Skipping row {} with missing fields: orderNumber={}, article={}, quantity={}, date={}, programme={}",
                            rowIndex, orderNumber, article, quantityObj, dateStr, programme);
                    continue;
                }

                Integer quantity;
                try {
                    quantity = quantityObj instanceof Number ? ((Number) quantityObj).intValue() : Integer.parseInt(quantityObj.toString());
                    if (quantity <= 0) throw new NumberFormatException();
                } catch (NumberFormatException e) {
                    logger.warn("Skipping row {} with invalid quantity: {}", rowIndex, quantityObj);
                    continue;
                }

                LocalDateTime date;
                try {
                    LocalDate localDate = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    date = localDate.atStartOfDay();
                } catch (Exception e) {
                    logger.warn("Skipping row {} with invalid date: {}", rowIndex, dateStr);
                    continue;
                }

                Optional<Program> programOpt = programRepository.findByName(programme);
                if (!programOpt.isPresent()) {
                    logger.warn("Skipping row {}: Program not found: {}", rowIndex, programme);
                    continue;
                }
                Program program = programOpt.get();
                Long programId = program.getId();

                // Check for evolution blocks
                List<Evolution> activeEvolutions = evolutionRepository.findByProgramIdAndIsActiveTrue(programId);
                boolean hasEvolution = false;
                String blockReason = null;
                Long evolutionId = null;

                for (Evolution evolution : activeEvolutions) {
                    if (evolution.getFutureIncrement() == null) {
                        // Program-level block
                        hasEvolution = true;
                        blockReason = "program: " + programme + " has active evolution without future increment";
                        evolutionId = evolution.getId();
                        break;
                    } else if (evolution.getArticle().equals(article) && !evolution.getFutureIncrement().equals(increment)) {
                        // Article-level block
                        hasEvolution = true;
                        blockReason = "article: " + article + " requires future increment: " + evolution.getFutureIncrement();
                        evolutionId = evolution.getId();
                        break;
                    }
                }

                if (hasEvolution) {
                    Map<String, String> blockedRow = new HashMap<>();
                    blockedRow.put("orderNumber", orderNumber);
                    blockedRow.put("article", article);
                    blockedRow.put("rowIndex", rowIndex);
                    blockedRow.put("reason", blockReason);
                    blockedRow.put("evolutionId", evolutionId != null ? evolutionId.toString() : "");
                    blockedByEvolutions.add(blockedRow);
                    logger.info("Row {} blocked by evolution: {} (evolutionId: {})", rowIndex, blockReason, evolutionId);
                    continue;
                }

                if (repository.findByOrderNumberAndArticle(orderNumber, article).isPresent()) {
                    if (!skipDuplicates) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate OF: orderNumber=" + orderNumber + ", article=" + article);
                    }
                    duplicateRows++;
                    logger.info("Skipping duplicate row {}: orderNumber={}, article={}", rowIndex, orderNumber, article);
                    continue;
                }

                boolean priority = articles.stream()
                        .filter(a -> article.equals(((String) a.get("article")).trim().toLowerCase()))
                        .findFirst()
                        .map(a -> (Boolean) a.getOrDefault("priority", false))
                        .orElse(false);

                OF of = new OF();
                of.setOrderNumber(orderNumber);
                of.setQuantity(quantity);
                of.setArticle(article);
                of.setDate(date);
                of.setProgramme(programme);
                of.setPriority(priority);
                of.setCreatedBy(user);
                of.setCreatedAt(LocalDateTime.now());

                validateOF(of);
                OF savedOF = repository.save(of);
                createdOFs.add(savedOF);

                // Update evolution if futureIncrement matches
                for (Evolution evolution : activeEvolutions) {
                    if (evolution.getArticle().equals(article) && evolution.getFutureIncrement() != null && evolution.getFutureIncrement().equals(increment)) {
                        evolution.setActive(false);
                        evolution.setClosedBy(user.getFullName());
                        evolution.setClosedAt(LocalDateTime.now());
                        evolutionRepository.save(evolution);
                        logger.info("Closed evolution ID: {} for article: {} with increment: {}", evolution.getId(), article, increment);
                    }
                }

                logger.info("Created OF ID: {} for orderNumber: {}, article: {}", savedOF.getId(), orderNumber, article);
            }

            if (createdOFs.isEmpty()) {
                if (duplicateRows == totalRows && totalRows > 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "All rows are duplicates");
                }
                if (!blockedByEvolutions.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Rows blocked by evolutions: " + objectMapper.writeValueAsString(blockedByEvolutions));
                }
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No valid rows to process");
            }

            return createdOFs;

        } catch (Exception e) {
            logger.error("Error creating OFs: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create OFs: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public OF updateOF(Long id, String jsonPayload) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OF ID");
        }
        OF of = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OF not found with ID: " + id));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can update OFs");
        }
        if (jsonPayload == null || jsonPayload.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload cannot be null or empty");
        }

        try {
            JsonNode jsonNode = objectMapper.readTree(jsonPayload);
            String orderNumber = getRequiredField(jsonNode, "orderNumber");
            String quantityStr = getRequiredField(jsonNode, "quantity");
            String article = getRequiredField(jsonNode, "article").toLowerCase();
            String dateStr = getRequiredField(jsonNode, "date");
            String programme = getRequiredField(jsonNode, "programme");
            boolean priority = jsonNode.has("priority") ? jsonNode.get("priority").asBoolean() : of.isPriority();
            String increment = jsonNode.has("increment") ? jsonNode.get("increment").asText() : null;

            Integer quantity;
            try {
                quantity = Integer.parseInt(quantityStr);
                if (quantity <= 0) throw new NumberFormatException();
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity: " + quantityStr);
            }

            LocalDateTime date;
            try {
                LocalDate localDate = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                date = localDate.atStartOfDay();
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format: " + dateStr);
            }

            Optional<Program> programOpt = programRepository.findByName(programme);
            if (!programOpt.isPresent()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program not found: " + programme);
            }
            Program program = programOpt.get();
            Long programId = program.getId();

            // Check for evolution blocks
            List<Evolution> activeEvolutions = evolutionRepository.findByProgramIdAndIsActiveTrue(programId);
            boolean hasEvolution = false;
            String blockReason = null;
            Long evolutionId = null;

            for (Evolution evolution : activeEvolutions) {
                if (evolution.getFutureIncrement() == null) {
                    hasEvolution = true;
                    blockReason = "program: " + programme + " has active evolution without future increment";
                    evolutionId = evolution.getId();
                    break;
                } else if (evolution.getArticle().equals(article) && !evolution.getFutureIncrement().equals(increment)) {
                    hasEvolution = true;
                    blockReason = "article: " + article + " requires future increment: " + evolution.getFutureIncrement();
                    evolutionId = evolution.getId();
                    break;
                }
            }

            if (hasEvolution) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Update blocked by evolution: " + blockReason + " (evolutionId: " + evolutionId + ")");
            }

            of.setOrderNumber(orderNumber);
            of.setQuantity(quantity);
            of.setArticle(article);
            of.setDate(date);
            of.setProgramme(programme);
            of.setPriority(priority);

            repository.findByOrderNumberAndArticle(orderNumber, article).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate OF: orderNumber=" + orderNumber + ", article=" + article);
                }
            });

            validateOF(of);
            OF updatedOF = repository.save(of);
            logger.info("Updated OF ID: {}", updatedOF.getId());
            return updatedOF;
        } catch (Exception e) {
            logger.error("Error updating OF ID {}: {}", id, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to process payload: " + e.getMessage());
        }
    }

    @Override
    public OF getOFById(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OF ID");
        }
        OF of = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OF not found with ID: " + id));
        logger.info("Retrieved OF ID: {}", id);
        return of;
    }

    @Override
    public List<OF> getAllOFs() {
        List<OF> ofs = repository.findAll();
        logger.info("Retrieved {} OFs", ofs.size());
        return ofs;
    }

    @Override
    @Transactional
    public void deleteOF(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OF ID");
        }
        OF of = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OF not found with ID: " + id));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can delete OFs");
        }
        repository.delete(of);
        logger.info("Deleted OF ID: {}", id);
    }

    @Override
    public List<OF> searchOFs(String data) {
        List<OF> ofs = repository.searchOFs(data);
        logger.info("Searched OFs with data '{}': {} results", data, ofs.size());
        return ofs;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkDuplicates(List<Map<String, String>> rows) {
        List<Map<String, String>> duplicates = new ArrayList<>();
        List<Map<String, Object>> blockedByEvolutions = new ArrayList<>();

        for (Map<String, String> row : rows) {
            String orderNumber = row.get("orderNumber");
            String article = row.get("article") != null ? row.get("article").trim().toLowerCase() : null;
            String rowIndex = row.get("rowIndex");
            String programme = row.get("programme");
            String increment = row.get("increment");

            if (orderNumber == null || article == null) continue;

            if (repository.findByOrderNumberAndArticle(orderNumber, article).isPresent()) {
                Map<String, String> duplicate = new HashMap<>();
                duplicate.put("orderNumber", orderNumber);
                duplicate.put("article", article);
                duplicate.put("rowIndex", rowIndex);
                duplicates.add(duplicate);
            }

            List<Map<String, String>> evolutions = new ArrayList<>();
            Optional<Program> programOpt = programRepository.findByName(programme);
            if (programOpt.isPresent()) {
                Program program = programOpt.get();
                Long programId = program.getId();
                List<Evolution> activeEvolutions = evolutionRepository.findByProgramIdAndIsActiveTrue(programId);

                for (Evolution evolution : activeEvolutions) {
                    Map<String, String> evolutionData = new HashMap<>();
                    evolutionData.put("field", "evolution");
                    evolutionData.put("reason", evolution.getReason());
                    evolutionData.put("evolutionId", evolution.getId().toString());
                    evolutionData.put("article", evolution.getArticle());
                    evolutionData.put("futureIncrement", evolution.getFutureIncrement() != null ? evolution.getFutureIncrement() : "");
                    if (evolution.getFutureIncrement() == null) {
                        evolutionData.put("blockReason", "program: " + programme + " has active evolution without future increment");
                    } else if (evolution.getArticle().equals(article) && !evolution.getFutureIncrement().equals(increment)) {
                        evolutionData.put("blockReason", "article: " + article + " requires future increment: " + evolution.getFutureIncrement());
                    } else {
                        continue;
                    }
                    evolutions.add(evolutionData);
                    logger.info("Evolution detected for row {}: {}", rowIndex, evolutionData.get("blockReason"));
                }
            }

            if (!evolutions.isEmpty()) {
                Map<String, Object> blockedRow = new HashMap<>();
                blockedRow.put("orderNumber", orderNumber);
                blockedRow.put("article", article);
                blockedRow.put("rowIndex", rowIndex);
                blockedRow.put("programme", programme);
                blockedRow.put("evolutions", evolutions);
                blockedByEvolutions.add(blockedRow);
                logger.info("Row {} blocked by {} evolutions", rowIndex, evolutions.size());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("duplicates", duplicates);
        result.put("blockedByEvolutions", blockedByEvolutions);
        result.put("allDuplicates", duplicates.size() == rows.size() && !rows.isEmpty());
        result.put("allBlockedByEvolutions", blockedByEvolutions.size() == rows.size() && !rows.isEmpty());
        logger.info("Checked duplicates: {} found, {} blocked by evolutions", duplicates.size(), blockedByEvolutions.size());
        return result;
    }
    @Override
    public List<CuttingSheet> findCuttingSheetsByArticleAndProgram(@RequestParam("article") String article, @RequestParam("program") String program) {
        if (article == null || article.trim().isEmpty() || program == null || program.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article and program are required");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can access cutting sheets");
        }
        List<CuttingSheet> cuttingSheets = cuttingSheetRepository.findByArticleAndProgramIgnoreCase(article.trim(), program.trim());
        logger.info("Retrieved {} cutting sheets for article: {} and program: {}", cuttingSheets.size(), article, program);
        return cuttingSheets;
    }
}