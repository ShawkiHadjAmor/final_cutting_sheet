package com.backend.cuttingsheet.dto;

public class SerialNumberRequest {
    private Long programId;
    private String article;
    private Long ofId;
    private Long quantite; // Added field

    private String reference;

    public Long getQuantite() {
		return quantite;
	}
	public void setQuantite(Long quantite) {
		this.quantite = quantite;
	}
	public Long getProgramId() { return programId; }
    public void setProgramId(Long programId) { this.programId = programId; }
    public String getArticle() { return article; }
    public void setArticle(String article) { this.article = article; }
    public Long getOfId() { return ofId; }
    public void setOfId(Long ofId) { this.ofId = ofId; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
}
