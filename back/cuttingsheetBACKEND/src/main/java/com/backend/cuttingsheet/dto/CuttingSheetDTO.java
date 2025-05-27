package com.backend.cuttingsheet.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CuttingSheetDTO {
    private Long id;
    private String article;
    private ProgramDTO program;
    private String indice;
    private String type;
    private boolean hasSerialNumber;
    private String operationsJson;
    private List<Long> customOperationIds;
    private String revisionHistory;
    private String createdBy;
    private LocalDateTime createdAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public ProgramDTO getProgram() { return program; }
    public void setProgram(ProgramDTO program) { this.program = program; }
    public String getIndice() { return indice; }
    public void setIndice(String indice) { this.indice = indice; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isHasSerialNumber() { return hasSerialNumber; }
    public void setHasSerialNumber(boolean hasSerialNumber) { this.hasSerialNumber = hasSerialNumber; }
    public String getOperationsJson() { return operationsJson; }
    public void setOperationsJson(String operationsJson) { this.operationsJson = operationsJson; }
    public List<Long> getCustomOperationIds() { return customOperationIds; }
    public void setCustomOperationIds(List<Long> customOperationIds) { this.customOperationIds = customOperationIds; }
    public String getRevisionHistory() { return revisionHistory; }
    public void setRevisionHistory(String revisionHistory) { this.revisionHistory = revisionHistory; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}