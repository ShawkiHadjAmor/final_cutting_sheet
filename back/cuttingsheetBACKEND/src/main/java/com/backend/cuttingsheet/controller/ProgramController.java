package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.entity.Program;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.IProgramApi;
import com.backend.cuttingsheet.repository.ProgramRepository;
import com.backend.cuttingsheet.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
public class ProgramController implements IProgramApi {
    private static final Logger logger = LoggerFactory.getLogger(ProgramController.class);
    private static final long MAX_IMAGE_SIZE = 16 * 1024 * 1024; 

    @Value("${upload.dir}")
    private String UPLOAD_DIR;

    @Autowired
    private ProgramRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private void validateExtractionRule(String extractionRule) {
        if (extractionRule == null || extractionRule.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Extraction rule is required and cannot be empty");
        }
        try {
            JsonNode ruleNode = objectMapper.readTree(extractionRule);
            if (!ruleNode.has("snFormat") || !ruleNode.has("zasypn") || !ruleNode.has("indice")) {
                throw new IllegalArgumentException("Missing required fields (snFormat, zasypn, indice)");
            }
            String snFormat = ruleNode.get("snFormat").asText();
            List<String> validFormats = Arrays.asList(
                "prefix-indice-increment", "increment-indice-prefix", "zasypn-increment-indice",
                "indice-increment-zasypn", "indice-zasypn-increment", "increment-zasypn-indice"
            );
            if (!validFormats.contains(snFormat)) {
                throw new IllegalArgumentException("Invalid snFormat: Must be one of " + validFormats);
            }
            String zasypn = ruleNode.get("zasypn").asText();
            String indice = ruleNode.get("indice").asText();
            if (zasypn.isEmpty() || zasypn.length() > 20) {
                throw new IllegalArgumentException("ZASYP/N must be non-empty and <= 20 characters");
            }
            if (indice.isEmpty() || indice.length() > 20) {
                throw new IllegalArgumentException("INDICE must be non-empty and <= 20 characters");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid extraction rule: " + e.getMessage());
        }
    }

    private void validateImageSize(MultipartFile image) {
        if (image != null && !image.isEmpty() && image.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image size exceeds maximum limit of 16MB");
        }
    }

    private String saveImage(MultipartFile image) throws IOException {
        String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        File dest = new File(uploadDir, fileName);
        logger.debug("Saving image to: {}", dest.getAbsolutePath());
        image.transferTo(dest);
        return "/uploads/programs/" + fileName;
    }

    @PreAuthorize("hasRole('ENGINEER')")
    @Override
    public Program createProgram(String name, MultipartFile image, String extractionRule) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Creating program: {} by user: {}", name, auth != null ? auth.getName() : "none");
        logger.debug("Received extractionRule: {}", extractionRule);

        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program name is required");
        }
        if (repository.findByName(name.trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Program with name exists");
        }
        validateExtractionRule(extractionRule);
        validateImageSize(image);

        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            logger.error("User not found for username: {}", auth.getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found");
        }

        Program program = new Program();
        program.setName(name.trim());
        if (image != null && !image.isEmpty()) {
            String imagePath = saveImage(image);
            program.setImagePath(imagePath);
        }
        program.setExtractionRule(extractionRule);
        program.setCreatedBy(user);
        program.setCreatedAt(LocalDateTime.now());
        program.setUpdateHistory("[]");

        Program savedProgram = repository.save(program);
        logger.info("Created program ID: {}", savedProgram.getId());
        return savedProgram;
    }

    @PreAuthorize("hasRole('ENGINEER')")
    @Override
    public Program updateProgram(Long id, String name, MultipartFile image, String extractionRule) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Updating program ID: {} by user: {}", id, auth != null ? auth.getName() : "none");
        logger.debug("Received extractionRule: {}", extractionRule);

        Optional<Program> programOptional = repository.findById(id);
        if (!programOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found");
        }
        Program program = programOptional.get();

        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program name is required");
        }
        Optional<Program> existingProgram = repository.findByName(name.trim());
        if (existingProgram.isPresent() && !existingProgram.get().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another program with name exists");
        }
        validateExtractionRule(extractionRule);
        validateImageSize(image);

        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            logger.error("User not found for username: {}", auth.getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found");
        }

        // Track changed fields
        ObjectNode historyEntry = objectMapper.createObjectNode();
        historyEntry.put("updateTimestamp", LocalDateTime.now().toString());
        historyEntry.put("updatedBy", user.getFirstName());
        ObjectNode changes = objectMapper.createObjectNode();

        // Compare and record changes for name
        if (!program.getName().equals(name.trim())) {
            ObjectNode nameChange = objectMapper.createObjectNode();
            nameChange.put("oldValue", program.getName());
            nameChange.put("newValue", name.trim());
            changes.set("name", nameChange);
        }

        // Compare and record changes for imagePath
        String newImagePath = program.getImagePath();
        if (image != null && !image.isEmpty()) {
            newImagePath = saveImage(image);
        } else if (image == null && program.getImagePath() != null) {
            newImagePath = null;
        }
        if ((program.getImagePath() == null && newImagePath != null) ||
            (program.getImagePath() != null && !program.getImagePath().equals(newImagePath))) {
            ObjectNode imageChange = objectMapper.createObjectNode();
            imageChange.put("oldValue", program.getImagePath() != null ? program.getImagePath() : "");
            imageChange.put("newValue", newImagePath != null ? newImagePath : "");
            changes.set("imagePath", imageChange);
        }

        // Compare and record changes for extractionRule
        if (!program.getExtractionRule().equals(extractionRule)) {
            ObjectNode ruleChange = objectMapper.createObjectNode();
            ruleChange.put("oldValue", program.getExtractionRule());
            ruleChange.put("newValue", extractionRule);
            changes.set("extractionRule", ruleChange);
        }

        // Only add history entry if there are changes
        if (!changes.isEmpty()) {
            historyEntry.set("changes", changes);
            ArrayNode historyArray;
            try {
                if (program.getUpdateHistory() != null && !program.getUpdateHistory().isEmpty()) {
                    historyArray = (ArrayNode) objectMapper.readTree(program.getUpdateHistory());
                } else {
                    historyArray = objectMapper.createArrayNode();
                }
            } catch (Exception e) {
                logger.error("Failed to parse update history: {}", e.getMessage());
                historyArray = objectMapper.createArrayNode();
            }

            historyArray.add(historyEntry);
            program.setUpdateHistory(objectMapper.writeValueAsString(historyArray));
        }

        // Update program fields
        program.setName(name.trim());
        program.setImagePath(newImagePath);
        program.setExtractionRule(extractionRule);
        program.setCreatedBy(user);
        program.setCreatedAt(LocalDateTime.now());

        Program updatedProgram = repository.save(program);
        logger.info("Updated program ID: {}", updatedProgram.getId());
        return updatedProgram;
    }

    @Override
    public Program getProgramById(Long id) {
        logger.info("Fetching program ID: {}", id);
        Optional<Program> programOptional = repository.findById(id);
        if (!programOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found");
        }
        return programOptional.get();
    }

    @Override
    public List<Program> getAllPrograms() {
        logger.info("Fetching all programs");
        return repository.findAll();
    }

    @PreAuthorize("hasRole('ENGINEER')")
    @Override
    public void deleteProgram(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Deleting program ID: {} by user: {}", id, auth != null ? auth.getName() : "none");

        Optional<Program> programOptional = repository.findById(id);
        if (!programOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found");
        }
        Program program = programOptional.get();

        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            logger.error("User not found for username: {}", auth.getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found");
        }

        if (!program.getCuttingSheets().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete program with associated cutting sheets");
        }

        repository.delete(program);
        logger.info("Deleted program ID: {}", id);
    }

    @Override
    public List<Program> searchProgramsByName(String name) {
        logger.info("Searching programs: {}", name);
        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search name is required");
        }
        return repository.findByNameContainingIgnoreCase(name.trim());
    }
}