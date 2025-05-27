package com.backend.cuttingsheet.dto;

import com.backend.cuttingsheet.entity.PreparedCuttingSheet;
import java.time.LocalDateTime;

public class PreparedCuttingSheetDTO {
    private Long id;
    private String article;
    private boolean hasCuttingSheet;
    private LocalDateTime createdAt;
    private Long preparationTime; // New field
    private OFDTO ordo;

    public PreparedCuttingSheetDTO(PreparedCuttingSheet sheet) {
        this.id = sheet.getId();
        this.article = sheet.getArticle();
        this.hasCuttingSheet = sheet.isHasCuttingSheet();
        this.createdAt = sheet.getCreatedAt();
        this.preparationTime = sheet.getPreparationTime();
        this.ordo = new OFDTO(sheet.getOf());
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public boolean isHasCuttingSheet() { return hasCuttingSheet; }
    public void setHasCuttingSheet(boolean hasCuttingSheet) { this.hasCuttingSheet = hasCuttingSheet; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Long preparationTime) { this.preparationTime = preparationTime; }
    public OFDTO getOrdo() { return ordo; }
    public void setOrdo(OFDTO ordo) { this.ordo = ordo; }
}