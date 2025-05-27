package com.backend.cuttingsheet.entity;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "custom_operations")
public class CustomOperation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Lob
    private String operationData;

    @Lob
    private String svgData;

    @Lob
    private String tabledata;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createdBy", nullable = false)
    @JsonIgnore
    private App_user createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToMany(mappedBy = "customOperations")
    @JsonIgnore
    private List<CuttingSheet> cuttingSheets = new ArrayList<>();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOperationData() { return operationData; }
    public void setOperationData(String operationData) { this.operationData = operationData; }
    public String getSvgData() { return svgData; }
    public void setSvgData(String svgData) { this.svgData = svgData; }
    public String getTabledata() { return tabledata; }
    public void setTabledata(String tabledata) { this.tabledata = tabledata; }
    public App_user getCreatedBy() { return createdBy; }
    public void setCreatedBy(App_user createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<CuttingSheet> getCuttingSheets() { return cuttingSheets; }
    public void setCuttingSheets(List<CuttingSheet> cuttingSheets) { this.cuttingSheets = cuttingSheets; }
}