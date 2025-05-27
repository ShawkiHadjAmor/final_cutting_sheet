package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.entity.*;
import com.backend.cuttingsheet.interfaces.IEvolutionApi;
import com.backend.cuttingsheet.repository.*;
import com.backend.cuttingsheet.dto.EvolutionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/evolutions")
public class EvolutionController implements IEvolutionApi {
    private static final Logger logger = LoggerFactory.getLogger(EvolutionController.class);

    @Autowired
    private EvolutionRepository evolutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private CuttingSheetRepository cuttingSheetRepository;

    @Autowired
    private ArticleIncrementRepository articleIncrementRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JavaMailSender mailSender;
    
    
    
 
    @Override
    @Transactional
    @PostMapping
    public EvolutionDTO createEvolution(@RequestBody EvolutionDTO payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("QUALITY")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only QUALITY can create evolutions");
        }

        if (payload.getProgramId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program ID is required");
        }
        if (payload.getArticle() == null || payload.getArticle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is required");
        }
        if (payload.getReason() == null || payload.getReason().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required");
        }

        Program program = programRepository.findById(payload.getProgramId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program not found with ID: " + payload.getProgramId()));

        Evolution evolution = new Evolution();
        evolution.setProgram(program);
        evolution.setArticle(payload.getArticle().trim());
        evolution.setReason(payload.getReason().trim());
        evolution.setCreatedBy(user.getFullName());
        evolution.setCreatedAt(LocalDateTime.now());
        evolution.setActive(true);

        Evolution savedEvolution = evolutionRepository.save(evolution);
        sendEvolutionCreatedEmail(savedEvolution);
        logger.info("Created evolution ID: {} for article: {}", savedEvolution.getId(), savedEvolution.getArticle());
        return convertToDTO(savedEvolution);
    }

    @Transactional
    @PutMapping("/{id}/ordo")
    public EvolutionDTO updateEvolutionByOrdo(@PathVariable Long id, @RequestBody EvolutionDTO payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can update evolutions");
        }

        Evolution evolution = evolutionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evolution not found with ID: " + id));
        if (!evolution.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evolution is already closed or resolved");
        }

        Optional<ArticleIncrement> articleIncrement = articleIncrementRepository.findByProgramIdAndArticle(
                evolution.getProgram().getId(), evolution.getArticle());
        
        String inputValue = payload.getFutureIncrement() != null ? payload.getFutureIncrement().trim() : null;
        String ordoComment = payload.getOrdoComment() != null ? payload.getOrdoComment().trim() : null;
        if (articleIncrement.isPresent() && articleIncrement.get().getLastIncrement() != null) {
            evolution.setFutureIncrement(inputValue);
            evolution.setOrderNumber(null);
        } else {
            evolution.setOrderNumber(inputValue);
            evolution.setFutureIncrement(null);
        }
        evolution.setOrdoComment(ordoComment);

        Evolution updatedEvolution = evolutionRepository.save(evolution);
        sendEvolutionUpdatedEmail(updatedEvolution, articleIncrement.isPresent() && articleIncrement.get().getLastIncrement() != null);
        logger.info("Updated evolution ID: {} by ORDO for article: {}", id, evolution.getArticle());
        return convertToDTO(updatedEvolution);
    }

    @Transactional
    @PutMapping("/{id}/quality")
    public EvolutionDTO updateEvolutionByQuality(@PathVariable Long id, @RequestBody EvolutionDTO payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("QUALITY")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only QUALITY can update evolutions");
        }

        Evolution evolution = evolutionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evolution not found with ID: " + id));
        if (!evolution.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evolution is already closed or resolved");
        }

        if (payload.getProgramId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program ID is required");
        }
        if (payload.getArticle() == null || payload.getArticle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is required");
        }
        if (payload.getReason() == null || payload.getReason().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required");
        }

        Program program = programRepository.findById(payload.getProgramId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program not found with ID: " + payload.getProgramId()));

        evolution.setProgram(program);
        evolution.setArticle(payload.getArticle().trim());
        evolution.setReason(payload.getReason().trim());
        evolution.setCreatedBy(user.getFullName());
        evolution.setCreatedAt(LocalDateTime.now());

        Evolution updatedEvolution = evolutionRepository.save(evolution);
        logger.info("Updated evolution ID: {} by QUALITY for article: {}", id, evolution.getArticle());
        return convertToDTO(updatedEvolution);
    }

    @Transactional
    @PutMapping("/{id}/close")
    public EvolutionDTO closeEvolution(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ENGINEER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ENGINEER can close evolutions");
        }

        Evolution evolution = evolutionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evolution not found with ID: " + id));
        if (!evolution.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evolution is already closed or resolved");
        }
        if (evolution.getOrdoComment() == null && evolution.getFutureIncrement() == null && evolution.getOrderNumber() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evolution must be updated by ORDO before closing");
        }

        evolution.setClosedBy(user.getFullName());
        evolution.setClosedAt(LocalDateTime.now());

        Evolution updatedEvolution = evolutionRepository.save(evolution);
        sendEvolutionClosedEmail(updatedEvolution);
        logger.info("Closed evolution ID: {} by ENGINEER: {}", id, user.getFullName());
        return convertToDTO(updatedEvolution);
    }

    @Transactional
    @PutMapping("/{id}/resolve")
    public EvolutionDTO resolveEvolution(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("QUALITY")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only QUALITY can resolve evolutions");
        }

        Evolution evolution = evolutionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evolution not found with ID: " + id));
        if (!evolution.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evolution is already resolved");
        }
        if (evolution.getClosedBy() == null || evolution.getClosedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evolution must be closed by ENGINEER before resolving");
        }

        evolution.setResolvedBy(user.getFullName());
        evolution.setResolvedAt(LocalDateTime.now());
        evolution.setActive(false);

        Evolution updatedEvolution = evolutionRepository.save(evolution);
        logger.info("Resolved evolution ID: {} by QUALITY: {}", id, user.getFullName());
        return convertToDTO(updatedEvolution);
    }

    @Override
    @GetMapping("/active")
    public List<EvolutionDTO> getActiveEvolutions() {
        List<Evolution> evolutions = evolutionRepository.findByIsActiveTrue();
        List<EvolutionDTO> response = evolutions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        logger.info("Fetched {} active evolutions", response.size());
        return response;
    }

    @Override
    @Cacheable(value = "articleIncrements", key = "#programId")
    @GetMapping("/program/{programId}/article-increments")
    public List<ArticleIncrement> getArticleIncrementsByProgram(@PathVariable final Long programId) {
        List<ArticleIncrement> increments = articleIncrementRepository.findByProgramId(programId);
        logger.info("Fetched {} article increments for programId: {}", increments.size(), programId);
        return increments;
    }

    @Override
    @Cacheable(value = "programs", key = "#id")
    @GetMapping("/program/{id}")
    public Program getProgramDetails(@PathVariable Long id) {
        Program program = programRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found with ID: " + id));
        logger.info("Fetched program details for ID: {}", id);
        return program;
    }

    @Override
    @GetMapping("/search-programs")
    public List<Map<String, Object>> searchPrograms(@RequestParam(value = "query", required = false) String query) {
        List<Program> programs = query == null || query.trim().isEmpty() ?
                programRepository.findAll() :
                programRepository.searchPrograms(query.trim().toLowerCase());

        List<Map<String, Object>> result = programs.stream().map(program -> {
            Map<String, Object> programData = new HashMap<>();
            programData.put("id", program.getId());
            programData.put("name", program.getName());
            try {
                Map<String, String> extractionRule = program.getExtractionRule() != null ?
                        objectMapper.readValue(program.getExtractionRule(), Map.class) : new HashMap<>();
                programData.put("indice", extractionRule.get("indice"));
                programData.put("zasypn", extractionRule.get("zasypn"));
            } catch (Exception e) {
                logger.warn("Failed to parse extraction rule for program ID {}: {}", program.getId(), e.getMessage());
                programData.put("indice", null);
                programData.put("zasypn", null);
            }
            return programData;
        }).collect(Collectors.toList());

        logger.info("Searched programs with query '{}': {} results", query, result.size());
        return result;
    }

    @Override
    @Cacheable(value = "articleIncrementsWithEvolution", key = "#programId + '-' + #article")
    @GetMapping("/program/{programId}/article/{article}/increment")
    public Map<String, Object> getArticleIncrementWithEvolution(@PathVariable final Long programId, @PathVariable String article) {
        String normalizedArticle = article.trim().toLowerCase();
        ArticleIncrement increment = articleIncrementRepository.findByProgramIdAndArticle(programId, normalizedArticle)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article increment not found for programId: " + programId + " and article: " + article));

        Map<String, Object> result = new HashMap<>();
        result.put("programId", programId);
        result.put("article", normalizedArticle);
        result.put("lastIncrement", increment.getLastIncrement());

        List<Evolution> activeEvolutions = evolutionRepository.findByProgramIdAndArticleAndIsActiveTrue(programId, normalizedArticle);
        if (!activeEvolutions.isEmpty()) {
            Evolution evolution = activeEvolutions.get(0);
            Map<String, Object> evolutionData = new HashMap<>();
            evolutionData.put("id", evolution.getId());
            evolutionData.put("futureIncrement", evolution.getFutureIncrement());
            evolutionData.put("orderNumber", evolution.getOrderNumber());
            evolutionData.put("reason", evolution.getReason());
            evolutionData.put("ordoComment", evolution.getOrdoComment());
            result.put("evolution", evolutionData);
        }

        logger.info("Fetched article increment for programId: {} and article: {}", programId, normalizedArticle);
        return result;
    }

    @Override
    @GetMapping("/program/{programId}/articles")
    public List<String> getArticlesByProgram(@PathVariable Long programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found with ID: " + programId));
        
        List<CuttingSheet> cuttingSheets = cuttingSheetRepository.findByProgram(program);
        List<String> articles = cuttingSheets.stream()
                .map(CuttingSheet::getArticle)
                .distinct()
                .collect(Collectors.toList());
        
        logger.info("Fetched {} articles for programId: {}", articles.size(), programId);
        return articles;
    }

    private void sendEvolutionCreatedEmail(Evolution evolution) {
    	List<App_user> ordoUsers = userRepository.findByRoleName("ORDO");
        logger.info("Found {} ORDO users for sending creation email", ordoUsers.size());

        Optional<ArticleIncrement> articleIncrement = articleIncrementRepository.findByProgramIdAndArticle(
                evolution.getProgram().getId(), evolution.getArticle());
        boolean hasLastIncrement = articleIncrement.isPresent() && articleIncrement.get().getLastIncrement() != null;

        StringBuilder emailText = new StringBuilder();
        emailText.append("Une nouvelle évolution a été créée.\n\n");
        emailText.append("Évolution #").append(evolution.getId()).append("\n");
        emailText.append("Programme: ").append(evolution.getProgram().getName()).append("\n");
        emailText.append("Article: ").append(evolution.getArticle()).append("\n");
        emailText.append("Raison: ").append(evolution.getReason()).append("\n");
        emailText.append("Créé par: ").append(evolution.getCreatedBy()).append("\n");
        emailText.append("Créé le: ").append(evolution.getCreatedAt()).append("\n\n");
        emailText.append("Veuillez spécifier ").append(hasLastIncrement ? "le SN bloqué" : "le numéro d'OF bloqué").append(" si applicable.");

        for (App_user ordo : ordoUsers) {
            if (ordo.getEmail() != null && ordo.getEmail().contains("@")) {
                logger.debug("Attempting to send creation email to {}", ordo.getEmail());
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(ordo.getEmail());
                message.setSubject("Nouvelle Évolution Créée - ID: " + evolution.getId());
                message.setText(emailText.toString());
                try {
                    mailSender.send(message);
                    logger.info("Sent evolution created email to {}", ordo.getEmail());
                } catch (Exception e) {
                    logger.error("Failed to send creation email to {}: {}", ordo.getEmail(), e.getMessage());
                }
            }
        }
    }

    private void sendEvolutionUpdatedEmail(Evolution evolution, boolean hasLastIncrement) {
    	List<App_user> engineers = userRepository.findByRoleName("ENGINEER");
        logger.info("Found {} ENGINEER users for sending update email", engineers.size());

        StringBuilder emailText = new StringBuilder();
        emailText.append("Une évolution a été mise à jour.\n\n");
        emailText.append("Évolution #").append(evolution.getId()).append("\n");
        emailText.append("Programme: ").append(evolution.getProgram().getName()).append("\n");
        emailText.append("Article: ").append(evolution.getArticle()).append("\n");
        emailText.append("Raison: ").append(evolution.getReason()).append("\n");
        if (hasLastIncrement && evolution.getFutureIncrement() != null) {
            emailText.append("SN bloqué: ").append(evolution.getFutureIncrement()).append("\n");
        } else if (!hasLastIncrement && evolution.getOrderNumber() != null) {
            emailText.append("Numéro d'OF bloqué: ").append(evolution.getOrderNumber()).append("\n");
        }
        if (evolution.getOrdoComment() != null && !evolution.getOrdoComment().isEmpty()) {
            emailText.append("Commentaire ORDO: ").append(evolution.getOrdoComment()).append("\n");
        }
        emailText.append("Créé par: ").append(evolution.getCreatedBy()).append("\n");

        for (App_user engineer : engineers) {
            if (engineer.getEmail() != null && engineer.getEmail().contains("@")) {
                logger.debug("Attempting to send update email to {}", engineer.getEmail());
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(engineer.getEmail());
                message.setSubject("Évolution Mise à Jour - ID: " + evolution.getId());
                message.setText(emailText.toString());
                try {
                    mailSender.send(message);
                    logger.info("Sent evolution updated email to {}", engineer.getEmail());
                } catch (Exception e) {
                    logger.error("Failed to send update email to {}: {}", engineer.getEmail(), e.getMessage());
                }
            }
        }
    }

    private void sendEvolutionClosedEmail(Evolution evolution) {
    	List<App_user> qualityUsers = userRepository.findByRoleName("QUALITY");
        logger.info("Found {} QUALITY users for sending closed email", qualityUsers.size());

        StringBuilder emailText = new StringBuilder();
        emailText.append("Une évolution a été clôturée par un ingénieur.\n\n");
        emailText.append("Évolution #").append(evolution.getId()).append("\n");
        emailText.append("Programme: ").append(evolution.getProgram().getName()).append("\n");
        emailText.append("Article: ").append(evolution.getArticle()).append("\n");
        emailText.append("Raison: ").append(evolution.getReason()).append("\n");
        if (evolution.getFutureIncrement() != null) {
            emailText.append("SN bloqué: ").append(evolution.getFutureIncrement()).append("\n");
        } else if (evolution.getOrderNumber() != null) {
            emailText.append("Numéro d'OF bloqué: ").append(evolution.getOrderNumber()).append("\n");
        }
        if (evolution.getOrdoComment() != null && !evolution.getOrdoComment().isEmpty()) {
            emailText.append("Commentaire ORDO: ").append(evolution.getOrdoComment()).append("\n");
        }
        emailText.append("Créé par: ").append(evolution.getCreatedBy()).append("\n");
        emailText.append("Clôturé par: ").append(evolution.getClosedBy()).append("\n");
        emailText.append("Clôturé le: ").append(evolution.getClosedAt()).append("\n\n");
        emailText.append("Veuillez examiner et résoudre l'évolution.");

        for (App_user quality : qualityUsers) {
            if (quality.getEmail() != null && quality.getEmail().contains("@")) {
                logger.debug("Attempting to send closed email to {}", quality.getEmail());
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(quality.getEmail());
                message.setSubject("Évolution Clôturée - ID: " + evolution.getId());
                message.setText(emailText.toString());
                try {
                    mailSender.send(message);
                    logger.info("Sent evolution closed email to {}", quality.getEmail());
                } catch (Exception e) {
                    logger.error("Failed to send closed email to {}: {}", quality.getEmail(), e.getMessage());
                }
            }
        }
    }

    private EvolutionDTO convertToDTO(Evolution evolution) {
        EvolutionDTO dto = new EvolutionDTO();
        dto.setId(evolution.getId());
        dto.setProgramId(evolution.getProgram().getId());
        dto.setProgramName(evolution.getProgram().getName());
        dto.setArticle(evolution.getArticle());
        dto.setReason(evolution.getReason());
        dto.setFutureIncrement(evolution.getFutureIncrement());
        dto.setOrderNumber(evolution.getOrderNumber());
        dto.setOrdoComment(evolution.getOrdoComment());
        dto.setCreatedBy(evolution.getCreatedBy());
        dto.setCreatedAt(evolution.getCreatedAt());
        dto.setClosedBy(evolution.getClosedBy());
        dto.setClosedAt(evolution.getClosedAt());
        dto.setResolvedBy(evolution.getResolvedBy());
        dto.setResolvedAt(evolution.getResolvedAt());
        dto.setActive(evolution.isActive());
        return dto;
    }
}