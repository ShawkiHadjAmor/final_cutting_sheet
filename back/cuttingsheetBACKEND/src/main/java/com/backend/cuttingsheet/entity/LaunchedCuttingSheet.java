	package com.backend.cuttingsheet.entity;
	
	import javax.persistence.*;
	import com.fasterxml.jackson.annotation.JsonIgnore;
	import java.time.LocalDateTime;
	
	@Entity
	@Table(name = "launched_cutting_sheets")
	public class LaunchedCuttingSheet {
	    @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "ofId", nullable = false)
	    @JsonIgnore
	    private OF of;
	
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "cuttingSheetId", nullable = false)
	    @JsonIgnore
	    private CuttingSheet cuttingSheet;
	
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "createdBy", nullable = false)
	    @JsonIgnore
	    private App_user createdBy;
	
	    @Column(nullable = false)
	    private LocalDateTime createdAt;
	
	    // Getters and Setters
	    public Long getId() { return id; }
	    public void setId(Long id) { this.id = id; }
	    public OF getOf() { return of; }
	    public void setOf(OF of) { this.of = of; }
	    public CuttingSheet getCuttingSheet() { return cuttingSheet; }
	    public void setCuttingSheet(CuttingSheet cuttingSheet) { this.cuttingSheet = cuttingSheet; }
	    public App_user getCreatedBy() { return createdBy; }
	    public void setCreatedBy(App_user createdBy) { this.createdBy = createdBy; }
	    public LocalDateTime getCreatedAt() { return createdAt; }
	    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
	}