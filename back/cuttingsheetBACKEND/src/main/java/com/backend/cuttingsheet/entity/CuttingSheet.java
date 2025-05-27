package com.backend.cuttingsheet.entity;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "cutting_sheets")
public class CuttingSheet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programId", nullable = false)
    @JsonIgnore
    private Program program;

    @Column(nullable = false)
    private String indice;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private boolean hasSerialNumber;

    @Lob
    private String operationsJson;

    @Lob
    private String revisionHistory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createdBy", nullable = false)
    @JsonIgnore
    private App_user createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToMany
    @JsonIgnore
    @JoinTable(
        name = "cutting_sheet_custom_operation",
        joinColumns = @JoinColumn(name = "cuttingSheetId"),
        inverseJoinColumns = @JoinColumn(name = "customOperationId")
    )
    private List<CustomOperation> customOperations = new ArrayList<>();

    public static final List<String> ALLOWED_TYPES = Arrays.asList("mecanique", "cablage", "montage");

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
    public String getIndice() { return indice; }
    public void setIndice(String indice) { this.indice = indice; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isHasSerialNumber() { return hasSerialNumber; }
    public void setHasSerialNumber(boolean hasSerialNumber) { this.hasSerialNumber = hasSerialNumber; }
    public String getOperationsJson() { return operationsJson; }
    public void setOperationsJson(String operationsJson) { this.operationsJson = operationsJson; }
    public String getRevisionHistory() { return revisionHistory; }
    public void setRevisionHistory(String revisionHistory) { this.revisionHistory = revisionHistory; }
    public App_user getCreatedBy() { return createdBy; }
    public void setCreatedBy(App_user createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<CustomOperation> getCustomOperations() { return customOperations; }
    public void setCustomOperations(List<CustomOperation> customOperations) { this.customOperations = customOperations; }
}