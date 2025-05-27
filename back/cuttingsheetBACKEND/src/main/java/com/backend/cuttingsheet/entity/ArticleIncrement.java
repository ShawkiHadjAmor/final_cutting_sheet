package com.backend.cuttingsheet.entity;

import javax.persistence.*;

@Entity
@Table(name = "article_increments")
public class ArticleIncrement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long programId;

    @Column(nullable = false)
    private String article;

    @Column(nullable = true)
    private Long lastIncrement;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProgramId() { return programId; }
    public void setProgramId(Long programId) { this.programId = programId; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public Long getLastIncrement() { return lastIncrement; }
    public void setLastIncrement(Long lastIncrement) { this.lastIncrement = lastIncrement; }
}