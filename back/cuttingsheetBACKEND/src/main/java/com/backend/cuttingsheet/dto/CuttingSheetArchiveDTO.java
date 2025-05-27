package com.backend.cuttingsheet.dto;

import com.backend.cuttingsheet.entity.CuttingSheetArchive;
import com.backend.cuttingsheet.entity.OF;
import com.backend.cuttingsheet.entity.ReprintEvent;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.Hibernate;

import java.util.List;
import java.util.stream.Collectors;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CuttingSheetArchiveDTO {
    private Long id;
    private String article;
    private OF ordo;
    private String serialNumber;
    private String printedAt;
    private String printedByUsername;
    private List<ReprintEventDTO> reprintEvents;
    private Long preparationTime; // Time in seconds

    public CuttingSheetArchiveDTO(CuttingSheetArchive archive) {
        this.id = archive.getId();
        this.article = archive.getArticle();
        Hibernate.initialize(archive.getOf());
        this.ordo = archive.getOf();
        this.serialNumber = archive.getSerialNumber();
        this.printedAt = archive.getPrintedAt() != null ? archive.getPrintedAt().toString() : null;
        this.printedByUsername = archive.getPrintedBy() != null ? archive.getPrintedBy().getFirstName() : null;
        Hibernate.initialize(archive.getReprintEvents());
        this.reprintEvents = archive.getReprintEvents().stream()
                .map(ReprintEventDTO::new)
                .collect(Collectors.toList());
        this.preparationTime = archive.getPreparationTime();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public OF getOrdo() { return ordo; }
    public void setOrdo(OF ordo) { this.ordo = ordo; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public String getPrintedAt() { return printedAt; }
    public void setPrintedAt(String printedAt) { this.printedAt = printedAt; }
    public String getPrintedByUsername() { return printedByUsername; }
    public void setPrintedByUsername(String printedByUsername) { this.printedByUsername = printedByUsername; }
    public List<ReprintEventDTO> getReprintEvents() { return reprintEvents; }
    public void setReprintEvents(List<ReprintEventDTO> reprintEvents) { this.reprintEvents = reprintEvents; }
    public Long getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Long preparationTime) { this.preparationTime = preparationTime; }

    public static class ReprintEventDTO {
        private String reason;
        private String reprintedAt;
        private String reprintedByUsername;

        public ReprintEventDTO(ReprintEvent event) {
            this.reason = event.getReason();
            this.reprintedAt = event.getReprintedAt() != null ? event.getReprintedAt().toString() : null;
            this.reprintedByUsername = event.getReprintedBy() != null ? event.getReprintedBy().getFirstName() : null;
        }

        // Getters and Setters
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getReprintedAt() { return reprintedAt; }
        public void setReprintedAt(String reprintedAt) { this.reprintedAt = reprintedAt; }
        public String getReprintedByUsername() { return reprintedByUsername; }
        public void setReprintedByUsername(String reprintedByUsername) { this.reprintedByUsername = reprintedByUsername; }
    }
}