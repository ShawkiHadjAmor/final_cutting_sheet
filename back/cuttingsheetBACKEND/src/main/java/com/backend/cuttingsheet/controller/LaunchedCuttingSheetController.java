package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.dto.LaunchedCuttingSheetDTO;
import com.backend.cuttingsheet.entity.CuttingSheet;
import com.backend.cuttingsheet.entity.CuttingSheetArchive;
import com.backend.cuttingsheet.entity.LaunchedCuttingSheet;
import com.backend.cuttingsheet.entity.OF;
import com.backend.cuttingsheet.entity.SerialNumber;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.ILaunchedCuttingSheetApi;
import com.backend.cuttingsheet.repository.CuttingSheetArchiveRepository;
import com.backend.cuttingsheet.repository.CuttingSheetRepository;
import com.backend.cuttingsheet.repository.LaunchedCuttingSheetRepository;
import com.backend.cuttingsheet.repository.OFRepository;
import com.backend.cuttingsheet.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class LaunchedCuttingSheetController implements ILaunchedCuttingSheetApi {
    private static final Logger logger = LoggerFactory.getLogger(LaunchedCuttingSheetController.class);

    @Autowired
    private LaunchedCuttingSheetRepository repository;

    @Autowired
    private OFRepository ofRepository;

    @Autowired
    private CuttingSheetRepository cuttingSheetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CuttingSheetArchiveRepository archiveRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private void validateLaunchedCuttingSheet(LaunchedCuttingSheet launchedCuttingSheet) {
        if (launchedCuttingSheet.getOf() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OF is required");
        }
        if (launchedCuttingSheet.getCuttingSheet() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CuttingSheet is required");
        }
        if (launchedCuttingSheet.getCreatedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Created at timestamp is required");
        }
    }

    @Override
    @Transactional
    public LaunchedCuttingSheet createLaunchedCuttingSheet(Map<String, String> payload) {
        if (payload == null || !payload.containsKey("ordoId") || !payload.containsKey("article")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload must contain ordoId and article");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("ORDO")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ORDO can create LaunchedCuttingSheets");
        }

        Long ordoId = Long.parseLong(payload.get("ordoId"));
        String article = payload.get("article");

        if (article == null || article.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "article cannot be null or empty");
        }

        OF of = ofRepository.findById(ordoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OF not found"));

        CuttingSheet cuttingSheet = cuttingSheetRepository.findByArticle(article)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CuttingSheet not found for article: " + article));

        if (repository.findByOfIdAndCuttingSheetId(ordoId, cuttingSheet.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "LaunchedCuttingSheet already exists for this OF and CuttingSheet");
        }

        LaunchedCuttingSheet launchedCuttingSheet = new LaunchedCuttingSheet();
        try {
            launchedCuttingSheet.setOf(of);
            launchedCuttingSheet.setCuttingSheet(cuttingSheet);
            launchedCuttingSheet.setCreatedBy(user);
            launchedCuttingSheet.setCreatedAt(LocalDateTime.now());
            validateLaunchedCuttingSheet(launchedCuttingSheet);
            LaunchedCuttingSheet savedLaunchedCuttingSheet = repository.save(launchedCuttingSheet);
            logger.info("Created LaunchedCuttingSheet ID: {}", savedLaunchedCuttingSheet.getId());
            return savedLaunchedCuttingSheet;
        } catch (Exception e) {
            logger.error("Error creating LaunchedCuttingSheet: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to create LaunchedCuttingSheet: " + e.getMessage());
        }
    }

    @Override
    public LaunchedCuttingSheet getLaunchedCuttingSheetById(Long id) {
        LaunchedCuttingSheet launchedCuttingSheet = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LaunchedCuttingSheet not found"));
        logger.info("Retrieved LaunchedCuttingSheet ID: {}", id);
        return launchedCuttingSheet;
    }

    @Override
    public List<LaunchedCuttingSheet> getAllLaunchedCuttingSheets() {
        List<LaunchedCuttingSheet> launchedCuttingSheets = repository.findAll();
        logger.info("Retrieved {} LaunchedCuttingSheets", launchedCuttingSheets.size());
        return launchedCuttingSheets;
    }

    @Override
    public List<LaunchedCuttingSheet> getLaunchedCuttingSheetsByOrdoId(Long ordoId) {
        List<LaunchedCuttingSheet> sheets = repository.findAll().stream()
                .filter(sheet -> sheet.getOf().getId().equals(ordoId))
                .collect(Collectors.toList());
        logger.info("Retrieved {} LaunchedCuttingSheets for ordoId: {}", sheets.size(), ordoId);
        return sheets;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LaunchedCuttingSheetDTO> getAllLaunchedCuttingSheetsWithOrdos() {
        List<LaunchedCuttingSheet> sheets = entityManager
                .createQuery("SELECT lcs FROM LaunchedCuttingSheet lcs " +
                        "JOIN FETCH lcs.of " +
                        "JOIN FETCH lcs.cuttingSheet cs " +
                        "JOIN FETCH cs.program", LaunchedCuttingSheet.class)
                .getResultList();
        List<LaunchedCuttingSheetDTO> dtos = sheets.stream()
                .map(LaunchedCuttingSheetDTO::new)
                .collect(Collectors.toList());
        logger.info("Retrieved {} LaunchedCuttingSheets with ordos", dtos.size());
        return dtos;
    }

    @Override
    @Transactional
    public void deleteLaunchedCuttingSheet(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null || !user.hasRole("CML")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only CML can delete LaunchedCuttingSheets");
        }

        LaunchedCuttingSheet launchedCuttingSheet = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LaunchedCuttingSheet not found"));

        CuttingSheetArchive archive = new CuttingSheetArchive();
        archive.setArticle(launchedCuttingSheet.getCuttingSheet().getArticle());
        archive.setOf(launchedCuttingSheet.getOf());
        archive.setPrintedBy(user);
        archive.setPrintedAt(LocalDateTime.now());
        TypedQuery<SerialNumber> query = entityManager.createQuery(
                "SELECT sn FROM SerialNumber sn WHERE sn.of.id = :ofId AND sn.article = :article",
                SerialNumber.class
        );
        query.setParameter("ofId", launchedCuttingSheet.getOf().getId());
        query.setParameter("article", launchedCuttingSheet.getCuttingSheet().getArticle());
        query.getResultStream()
                .findFirst()
                .ifPresent(sn -> archive.setSerialNumber(sn.getSerialNumberFrom()));
        archiveRepository.save(archive);

        repository.delete(launchedCuttingSheet);
        logger.info("Deleted LaunchedCuttingSheet ID: {} and archived", id);
    }
}