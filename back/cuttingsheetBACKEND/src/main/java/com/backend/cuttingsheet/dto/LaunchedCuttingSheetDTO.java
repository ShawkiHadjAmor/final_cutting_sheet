package com.backend.cuttingsheet.dto;

import com.backend.cuttingsheet.entity.CuttingSheet;
import com.backend.cuttingsheet.entity.LaunchedCuttingSheet;
import com.backend.cuttingsheet.entity.OF;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LaunchedCuttingSheetDTO {
    private Long id;
    private String article;
    private OF ordo;
    private CuttingSheet cuttingSheet;
    private String createdAt;

    public LaunchedCuttingSheetDTO(LaunchedCuttingSheet launchedCuttingSheet) {
        this.id = launchedCuttingSheet.getId();
        this.article = launchedCuttingSheet.getCuttingSheet() != null ? launchedCuttingSheet.getCuttingSheet().getArticle() : null;
        this.ordo = launchedCuttingSheet.getOf();
        this.cuttingSheet = launchedCuttingSheet.getCuttingSheet();
        this.createdAt = launchedCuttingSheet.getCreatedAt() != null ? launchedCuttingSheet.getCreatedAt().toString() : null;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public OF getOrdo() { return ordo; }
    public void setOrdo(OF ordo) { this.ordo = ordo; }
    public CuttingSheet getCuttingSheet() { return cuttingSheet; }
    public void setCuttingSheet(CuttingSheet cuttingSheet) { this.cuttingSheet = cuttingSheet; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}