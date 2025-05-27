package com.backend.cuttingsheet.dto;

import java.time.LocalDateTime;

public class SerialNumberResponseDTO {
    private Long id;
    private String programName;
    private String serialNumberFrom;
    private String serialNumberTo;
    private String plan;
    private String indice;
    private String article;
    private Long increment;
    private LocalDateTime createdAt;
    private Long ofId;
    private String orderNumber;
    private Integer quantity;
    private String date;
    private String programme;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProgramName() { return programName; }
    public void setProgramName(String programName) { this.programName = programName; }
    public String getSerialNumberFrom() { return serialNumberFrom; }
    public void setSerialNumberFrom(String serialNumberFrom) { this.serialNumberFrom = serialNumberFrom; }
    public String getSerialNumberTo() { return serialNumberTo; }
    public void setSerialNumberTo(String serialNumberTo) { this.serialNumberTo = serialNumberTo; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getIndice() { return indice; }
    public void setIndice(String indice) { this.indice = indice; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public Long getIncrement() { return increment; }
    public void setIncrement(Long increment) { this.increment = increment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getOfId() { return ofId; }
    public void setOfId(Long ofId) { this.ofId = ofId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getProgramme() { return programme; }
    public void setProgramme(String programme) { this.programme = programme; }
}