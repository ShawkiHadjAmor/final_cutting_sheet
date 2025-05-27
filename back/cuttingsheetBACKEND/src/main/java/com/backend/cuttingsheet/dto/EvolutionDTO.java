package com.backend.cuttingsheet.dto;

import java.time.LocalDateTime;

public class EvolutionDTO {
    private Long id;
    private Long programId;
    private String programName;
    private String article;
    private String reason;
    private String futureIncrement;
    private String orderNumber;
    private String ordoComment;
    private String createdBy; // Stores "firstName lastName"
    private LocalDateTime createdAt;
    private String closedBy; // Stores "firstName lastName"
    private LocalDateTime closedAt;
    private String resolvedBy; // Stores "firstName lastName"
    private LocalDateTime resolvedAt;
    private boolean isActive;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProgramId() { return programId; }
    public void setProgramId(Long programId) { this.programId = programId; }
    public String getProgramName() { return programName; }
    public void setProgramName(String programName) { this.programName = programName; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getFutureIncrement() { return futureIncrement; }
    public void setFutureIncrement(String futureIncrement) { this.futureIncrement = futureIncrement; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getOrdoComment() { return ordoComment; }
    public void setOrdoComment(String ordoComment) { this.ordoComment = ordoComment; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getClosedBy() { return closedBy; }
    public void setClosedBy(String closedBy) { this.closedBy = closedBy; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}