package com.backend.cuttingsheet.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "prepared_cutting_sheets")
public class PreparedCuttingSheet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ofId", nullable = false)
    @JsonIgnore
    private OF of;

    @Column(nullable = false)
    private String article;

    @Column(nullable = false)
    private boolean hasCuttingSheet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createdBy", nullable = false)
    @JsonIgnore
    private App_user createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private Long preparationTime; // New field to store preparation time in seconds

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public OF getOf() { return of; }
    public void setOf(OF of) { this.of = of; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public boolean isHasCuttingSheet() { return hasCuttingSheet; }
    public void setHasCuttingSheet(boolean hasCuttingSheet) { this.hasCuttingSheet = hasCuttingSheet; }
    public App_user getCreatedBy() { return createdBy; }
    public void setCreatedBy(App_user createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Long preparationTime) { this.preparationTime = preparationTime; }
}