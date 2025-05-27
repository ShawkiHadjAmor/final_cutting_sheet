package com.backend.cuttingsheet.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "evolutions")
public class Evolution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programId", nullable = false)
    @JsonIgnore
    private Program program;

    @Column(nullable = false)
    private String article;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column
    private String futureIncrement;

    @Column
    private String orderNumber;

    @Column(length = 500)
    private String ordoComment;

    @Column(nullable = false)
    private String createdBy; // Stores "firstName lastName"

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private String closedBy; // Stores "firstName lastName"

    @Column
    private LocalDateTime closedAt;

    @Column
    private String resolvedBy; // New field for QUALITY user who resolves

    @Column
    private LocalDateTime resolvedAt;

    @Column(nullable = false)
    private boolean isActive;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getFutureIncrement() { return futureIncrement; }
    public void setFutureIncrement(String futureIncrement) { this.futureIncrement = futureIncrement; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getOrdoComment() { return ordoComment; }
    public void setOrdoComment(String ordoComment) { this.ordoComment = ordoComment; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getClosedBy() { return closedBy; }
    public void setClosedBy(String closedBy) { this.closedBy = closedBy; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}