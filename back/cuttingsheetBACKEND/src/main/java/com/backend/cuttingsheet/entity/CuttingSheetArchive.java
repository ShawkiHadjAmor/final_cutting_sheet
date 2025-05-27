package com.backend.cuttingsheet.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cutting_sheet_archive")
public class CuttingSheetArchive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ofId", nullable = false)
    @JsonIgnore
    private OF of;

    @Column
    private String serialNumber;

    @Column(nullable = false)
    private LocalDateTime printedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "printedBy", nullable = false)
    @JsonIgnore
    private App_user printedBy;

    @OneToMany(mappedBy = "archive", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ReprintEvent> reprintEvents = new ArrayList<>();

    @Column
    private Long preparationTime; // Time in seconds

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public OF getOf() { return of; }
    public void setOf(OF of) { this.of = of; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public LocalDateTime getPrintedAt() { return printedAt; }
    public void setPrintedAt(LocalDateTime printedAt) { this.printedAt = printedAt; }
    public App_user getPrintedBy() { return printedBy; }
    public void setPrintedBy(App_user printedBy) { this.printedBy = printedBy; }
    public List<ReprintEvent> getReprintEvents() { return reprintEvents; }
    public void setReprintEvents(List<ReprintEvent> reprintEvents) { this.reprintEvents = reprintEvents; }
    public Long getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Long preparationTime) { this.preparationTime = preparationTime; }
}