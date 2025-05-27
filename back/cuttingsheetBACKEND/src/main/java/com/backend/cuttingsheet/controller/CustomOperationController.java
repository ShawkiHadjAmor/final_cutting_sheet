package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.entity.CustomOperation;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.ICustomOperationApi;
import com.backend.cuttingsheet.repository.CustomOperationRepository;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CustomOperationController implements ICustomOperationApi {
    private static final Logger logger = LoggerFactory.getLogger(CustomOperationController.class);
    private static final long MAX_DATA_SIZE_BYTES = 16 * 1024 * 1024; // 16MB

    @Autowired
    private CustomOperationRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String getRequiredField(JsonNode jsonNode, String fieldName) {
        if (!jsonNode.has(fieldName) || jsonNode.get(fieldName).isNull() || jsonNode.get(fieldName).asText().isEmpty()) {
            throw new IllegalArgumentException("Field '" + fieldName + "' is required");
        }
        return jsonNode.get(fieldName).asText();
    }

    @Override
    @Transactional
    public CustomOperation createCustomOperation(String jsonPayload) {
        if (jsonPayload == null || jsonPayload.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload cannot be null or empty");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can create custom operations");
        }
        CustomOperation customOperation = new CustomOperation();
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonPayload);
            String name = getRequiredField(jsonNode, "name");
            if (repository.findByName(name).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Custom operation with name exists");
            }
            customOperation.setName(name);
            JsonNode operationDataNode = jsonNode.get("operationData");
            customOperation.setOperationData(
                operationDataNode != null && !operationDataNode.isNull()
                    ? objectMapper.writeValueAsString(operationDataNode)
                    : "{}"
            );
            JsonNode svgDataNode = jsonNode.get("svgData");
            String svgData = svgDataNode != null && !svgDataNode.isNull() ? svgDataNode.asText() : null;
            if (svgData != null && svgData.getBytes().length > MAX_DATA_SIZE_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SVG data exceeds maximum size of 16MB");
            }
            customOperation.setSvgData(svgData);
            JsonNode tabledataNode = jsonNode.get("tabledata");
            String tabledata = tabledataNode != null && !tabledataNode.isNull() ? objectMapper.writeValueAsString(tabledataNode) : "{}";
            if (tabledata.getBytes().length > MAX_DATA_SIZE_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Table data exceeds maximum size of 16MB");
            }
            customOperation.setTabledata(tabledata);
            customOperation.setCreatedBy(user);
            customOperation.setCreatedAt(LocalDateTime.now());
        } catch (Exception e) {
            logger.error("Error creating custom operation: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to process payload: " + e.getMessage());
        }
        CustomOperation savedOperation = repository.save(customOperation);
        logger.info("Created custom operation ID: {}", savedOperation.getId());
        return savedOperation;
    }

    @Override
    @Transactional
    public CustomOperation updateCustomOperation(Long id, String jsonPayload) {
        CustomOperation operation = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Custom operation not found"));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if  (user == null || !!user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can update custom operations");
        }
        try {
            JsonNode jsonNode = objectMapper.readTree(jsonPayload);
            String name = getRequiredField(jsonNode, "name");
            repository.findByName(name).ifPresent(op -> {
                if (!op.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Another custom operation with name exists");
                }
            });
            operation.setName(name);
            JsonNode operationDataNode = jsonNode.get("operationData");
            operation.setOperationData(
                operationDataNode != null && !operationDataNode.isNull()
                    ? objectMapper.writeValueAsString(operationDataNode)
                    : "{}"
            );
            JsonNode svgDataNode = jsonNode.get("svgData");
            String svgData = svgDataNode != null && !svgDataNode.isNull() ? svgDataNode.asText() : operation.getSvgData();
            if (svgData != null && svgData.getBytes().length > MAX_DATA_SIZE_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SVG data exceeds maximum size of 16MB");
            }
            operation.setSvgData(svgData);
            JsonNode tabledataNode = jsonNode.get("tabledata");
            String tabledata = tabledataNode != null && !tabledataNode.isNull() ? objectMapper.writeValueAsString(tabledataNode) : operation.getTabledata();
            if (tabledata != null && tabledata.getBytes().length > MAX_DATA_SIZE_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Table data exceeds maximum size of 16MB");
            }
            operation.setTabledata(tabledata);
        } catch (Exception e) {
            logger.error("Error updating custom operation ID {}: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to process payload: " + e.getMessage());
        }
        CustomOperation updatedOperation = repository.save(operation);
        logger.info("Updated custom operation ID: {}", updatedOperation.getId());
        return updatedOperation;
    }

    @Override
    public CustomOperation getCustomOperationById(Long id) {
        CustomOperation operation = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Custom operation not found"));
        logger.info("Retrieved custom operation ID: {}", id);
        return operation;
    }

    @Override
    public List<CustomOperation> getAllCustomOperations() {
        List<CustomOperation> operations = repository.findAll();
        logger.info("Retrieved {} custom operations", operations.size());
        return operations;
    }

    @Override
    @Transactional
    public void deleteCustomOperation(Long id) {
        CustomOperation operation = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Custom operation not found"));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if  (user == null || !user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can delete custom operations");
        }
        if (!operation.getCuttingSheets().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete custom operation with associated cutting sheets");
        }
        repository.delete(operation);
        logger.info("Deleted custom operation ID: {}", id);
    }

    @Override
    public List<CustomOperation> searchCustomOperationsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return repository.findAll();
        }
        return repository.findByNameContainingIgnoreCase(name);
    }
}