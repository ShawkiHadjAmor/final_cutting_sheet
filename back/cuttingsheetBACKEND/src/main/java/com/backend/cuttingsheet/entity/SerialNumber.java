package com.backend.cuttingsheet.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "serial_numbers")
public class SerialNumber {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programId", nullable = false)
    @JsonIgnore
    private Program program;

    @Column(nullable = false)
    private String serialNumberFrom;

    @Column(nullable = false)
    private String serialNumberTo;

    @Column(name = "plan_details", nullable = false)
    private String plan;

    @Column(nullable = false)
    private String indice;

    @Column(nullable = false)
    private String article;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "ofId", nullable = true)
    @JsonIgnore
    private OF of;

    @Column(nullable = false)
    private String reference;

    @Column(nullable = false)
    private Long increment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
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
    public OF getOf() { return of; }
    public void setOf(OF of) { this.of = of; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public Long getIncrement() { return increment; }
    public void setIncrement(Long increment) { this.increment = increment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}