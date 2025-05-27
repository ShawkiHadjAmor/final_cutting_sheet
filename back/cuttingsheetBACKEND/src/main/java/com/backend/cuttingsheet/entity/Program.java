package com.backend.cuttingsheet.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programs")
public class Program {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(name = "image_path")
    private String imagePath;

    @Lob
    @Column(name = "extraction_rule")
    private String extractionRule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createdBy", nullable = false)
    @JsonIgnore
    private App_user createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "program", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CuttingSheet> cuttingSheets = new ArrayList<>();

    @OneToMany(mappedBy = "program", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Evolution> evolutions = new ArrayList<>();

    @Lob
    @Column(name = "update_history")
    private String updateHistory;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }
    public String getExtractionRule() { return extractionRule; }
    public void setExtractionRule(String extractionRule) { this.extractionRule = extractionRule; }
    public App_user getCreatedBy() { return createdBy; }
    public void setCreatedBy(App_user createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<CuttingSheet> getCuttingSheets() { return cuttingSheets; }
    public void setCuttingSheets(List<CuttingSheet> cuttingSheets) { this.cuttingSheets = cuttingSheets; }
    public List<Evolution> getEvolutions() { return evolutions; }
    public void setEvolutions(List<Evolution> evolutions) { this.evolutions = evolutions; }
    public String getUpdateHistory() { return updateHistory; }
    public void setUpdateHistory(String updateHistory) { this.updateHistory = updateHistory; }
}