package com.backend.cuttingsheet.dto;

public class ProgramDTO {
    private Long id;
    private String name;
    private String imagePath;
    private String extractionRule;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }
    public String getExtractionRule() { return extractionRule; }
    public void setExtractionRule(String extractionRule) { this.extractionRule = extractionRule; }
}