package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.dto.PreparedCuttingSheetDTO;
import com.backend.cuttingsheet.entity.OF;
import com.backend.cuttingsheet.entity.PreparedCuttingSheet;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.IPreparedCuttingSheetApi;
import com.backend.cuttingsheet.repository.OFRepository;
import com.backend.cuttingsheet.repository.PreparedCuttingSheetRepository;
import com.backend.cuttingsheet.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class PreparedCuttingSheetController implements IPreparedCuttingSheetApi {
    private static final Logger logger = LoggerFactory.getLogger(PreparedCuttingSheetController.class);

    @Autowired
    private PreparedCuttingSheetRepository repository;

    @Autowired
    private OFRepository ofRepository;

    @Autowired
    private UserRepository userRepository;

    private void validatePreparedCuttingSheet(PreparedCuttingSheet preparedCuttingSheet) {
        if (preparedCuttingSheet.getOf() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OF is required");
        }
        if (preparedCuttingSheet.getArticle() == null || preparedCuttingSheet.getArticle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is required");
        }
        if (preparedCuttingSheet.getCreatedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Created at timestamp is required");
        }
        if (preparedCuttingSheet.getPreparationTime() != null && preparedCuttingSheet.getPreparationTime() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preparation time cannot be negative");
        }
    }

    @Override
    @Transactional
    public PreparedCuttingSheet createPreparedCuttingSheet(Map<String, String> payload) {
        if (payload == null || !payload.containsKey("ordoId") || !payload.containsKey("article") || !payload.containsKey("hasCuttingSheet")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload must contain ordoId, article, and hasCuttingSheet");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can create PreparedCuttingSheets");
        }

        Long ordoId = Long.parseLong(payload.get("ordoId"));
        String article = payload.get("article");
        boolean hasCuttingSheet = Boolean.parseBoolean(payload.get("hasCuttingSheet"));

        if (article == null || article.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "article cannot be null or empty");
        }

        OF of = ofRepository.findById(ordoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OF not found"));

        if (repository.findByOfIdAndArticle(ordoId, article).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PreparedCuttingSheet already exists for this OF and article");
        }

        PreparedCuttingSheet preparedCuttingSheet = new PreparedCuttingSheet();
        try {
            preparedCuttingSheet.setOf(of);
            preparedCuttingSheet.setArticle(article);
            preparedCuttingSheet.setHasCuttingSheet(hasCuttingSheet);
            preparedCuttingSheet.setCreatedBy(user);
            preparedCuttingSheet.setCreatedAt(LocalDateTime.now());
            validatePreparedCuttingSheet(preparedCuttingSheet);
            PreparedCuttingSheet savedPreparedCuttingSheet = repository.save(preparedCuttingSheet);
            logger.info("Created PreparedCuttingSheet ID: {}", savedPreparedCuttingSheet.getId());
            return savedPreparedCuttingSheet;
        } catch (Exception e) {
            logger.error("Error creating PreparedCuttingSheet: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to create PreparedCuttingSheet: " + e.getMessage());
        }
    }

    @Override
    public PreparedCuttingSheet getPreparedCuttingSheetById(Long id) {
        PreparedCuttingSheet preparedCuttingSheet = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PreparedCuttingSheet not found"));
        logger.info("Retrieved PreparedCuttingSheet ID: {}", id);
        return preparedCuttingSheet;
    }



    @Override
    public List<PreparedCuttingSheet> getAllPreparedCuttingSheets() {
        List<PreparedCuttingSheet> preparedCuttingSheets = repository.findAll();
        logger.info("Retrieved {} PreparedCuttingSheets", preparedCuttingSheets.size());
        return preparedCuttingSheets;
    }

    @Override
    public List<PreparedCuttingSheet> getPreparedCuttingSheetsByOrdoId(Long ordoId) {
        List<PreparedCuttingSheet> sheets = repository.findAll().stream()
                .filter(sheet -> sheet.getOf().getId().equals(ordoId))
                .collect(Collectors.toList());
        logger.info("Retrieved {} PreparedCuttingSheets for ordoId: {}", sheets.size(), ordoId);
        return sheets;
    }

    @Override
    public List<PreparedCuttingSheetDTO> getAllPreparedCuttingSheetsWithOrdos() {
        List<PreparedCuttingSheet> sheets = repository.findAll();
        List<PreparedCuttingSheetDTO> dtos = sheets.stream()
                .map(PreparedCuttingSheetDTO::new)
                .collect(Collectors.toList());
        logger.info("Retrieved {} PreparedCuttingSheets with ordos", dtos.size());
        return dtos;
    }

    @Override
    @Transactional
    public PreparedCuttingSheet updatePreparationTime(Long id, Map<String, Long> payload) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid PreparedCuttingSheet ID");
        }
        PreparedCuttingSheet sheet = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PreparedCuttingSheet not found with ID: " + id));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("STOREKEEPER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only STOREKEEPER can update preparation time");
        }
        if (payload == null || !payload.containsKey("preparationTime")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload must contain preparationTime");
        }
        Long preparationTime = payload.get("preparationTime");
        if (preparationTime == null || preparationTime < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preparation time must be a non-negative number");
        }
        sheet.setPreparationTime(preparationTime);
        validatePreparedCuttingSheet(sheet);
        PreparedCuttingSheet updatedSheet = repository.save(sheet);
        logger.info("Updated preparation time for PreparedCuttingSheet ID: {}", id);
        return updatedSheet;
    }

    @Override
    public List<PreparedCuttingSheetDTO> searchByOrderNumber(String orderNumber) {
        if (orderNumber == null || orderNumber.trim().isEmpty()) {
            return getAllPreparedCuttingSheetsWithOrdos();
        }
        List<PreparedCuttingSheet> sheets = repository.findByOrderNumberContaining(orderNumber);
        List<PreparedCuttingSheetDTO> dtos = sheets.stream()
                .map(PreparedCuttingSheetDTO::new)
                .collect(Collectors.toList());
        logger.info("Retrieved {} PreparedCuttingSheets for orderNumber search: {}", dtos.size(), orderNumber);
        return dtos;
    }
}