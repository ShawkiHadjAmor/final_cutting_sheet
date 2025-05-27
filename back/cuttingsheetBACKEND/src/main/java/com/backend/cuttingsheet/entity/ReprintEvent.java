package com.backend.cuttingsheet.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "reprint_events")
public class ReprintEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime reprintedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reprintedBy", nullable = false)
    @JsonIgnore
    private App_user reprintedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archiveId", nullable = false)
    @JsonIgnore
    private CuttingSheetArchive archive;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getReprintedAt() { return reprintedAt; }
    public void setReprintedAt(LocalDateTime reprintedAt) { this.reprintedAt = reprintedAt; }
    public App_user getReprintedBy() { return reprintedBy; }
    public void setReprintedBy(App_user reprintedBy) { this.reprintedBy = reprintedBy; }
    public CuttingSheetArchive getArchive() { return archive; }
    public void setArchive(CuttingSheetArchive archive) { this.archive = archive; }
}