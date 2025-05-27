package com.backend.cuttingsheet.dto;

import com.backend.cuttingsheet.entity.OF;
import java.time.LocalDateTime;

public class OFDTO {
    private Long id;
    private String orderNumber;
    private Integer quantity;
    private String article;
    private LocalDateTime date;
    private String programme;
    private boolean priority; // New field
    private LocalDateTime createdAt;

    public OFDTO(OF of) {
        this.id = of.getId();
        this.orderNumber = of.getOrderNumber();
        this.quantity = of.getQuantity();
        this.article = of.getArticle();
        this.date = of.getDate();
        this.programme = of.getProgramme();
        this.priority = of.isPriority();
        this.createdAt = of.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public String getProgramme() { return programme; }
    public void setProgramme(String programme) { this.programme = programme; }
    public boolean isPriority() { return priority; }
    public void setPriority(boolean priority) { this.priority = priority; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}