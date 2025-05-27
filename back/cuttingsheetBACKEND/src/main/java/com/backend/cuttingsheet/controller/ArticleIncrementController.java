package com.backend.cuttingsheet.controller;

import com.backend.cuttingsheet.entity.ArticleIncrement;
import com.backend.cuttingsheet.entity.App_user;
import com.backend.cuttingsheet.interfaces.IArticleIncrementApi;
import com.backend.cuttingsheet.repository.ArticleIncrementRepository;
import com.backend.cuttingsheet.repository.ProgramRepository;
import com.backend.cuttingsheet.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
public class ArticleIncrementController implements IArticleIncrementApi {
    private static final Logger logger = LoggerFactory.getLogger(ArticleIncrementController.class);

    @Autowired
    private ArticleIncrementRepository repository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private UserRepository userRepository;

    private void validateArticleIncrement(ArticleIncrement articleIncrement) {
        if (articleIncrement.getProgramId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program ID is required");
        }
        if (!programRepository.existsById(articleIncrement.getProgramId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program does not exist");
        }
        if (articleIncrement.getArticle() == null || articleIncrement.getArticle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is required");
        }
        if (articleIncrement.getLastIncrement() == null || articleIncrement.getLastIncrement() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Last increment must be non-negative");
        }
    }

    @PreAuthorize("hasRole('ENGINEER')")
    @Override
    public ArticleIncrement createArticleIncrement(ArticleIncrement articleIncrement) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Creating article increment for program ID: {} and article: {} by user: {}",
            articleIncrement.getProgramId(), articleIncrement.getArticle(), auth != null ? auth.getName() : "none");

        validateArticleIncrement(articleIncrement);

        Optional<ArticleIncrement> existing = repository.findByProgramIdAndArticle(
            articleIncrement.getProgramId(), articleIncrement.getArticle().trim());
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Article increment for this program and article exists");
        }

        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            logger.error("User not found for username: {}", auth.getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found");
        }

        ArticleIncrement newIncrement = new ArticleIncrement();
        newIncrement.setProgramId(articleIncrement.getProgramId());
        newIncrement.setArticle(articleIncrement.getArticle().trim());
        newIncrement.setLastIncrement(articleIncrement.getLastIncrement());

        ArticleIncrement savedIncrement = repository.save(newIncrement);
        logger.info("Created article increment ID: {}", savedIncrement.getId());
        return savedIncrement;
    }

    @PreAuthorize("hasRole('ENGINEER')")
    @Override
    public ArticleIncrement updateArticleIncrement(Long id, ArticleIncrement articleIncrement) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Updating article increment ID: {} by user: {}", id, auth != null ? auth.getName() : "none");

        Optional<ArticleIncrement> incrementOptional = repository.findById(id);
        if (!incrementOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article increment not found");
        }
        ArticleIncrement existingIncrement = incrementOptional.get();

        validateArticleIncrement(articleIncrement);

        Optional<ArticleIncrement> existingWithSameKeys = repository.findByProgramIdAndArticle(
            articleIncrement.getProgramId(), articleIncrement.getArticle().trim());
        if (existingWithSameKeys.isPresent() && !existingWithSameKeys.get().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another article increment with this program and article exists");
        }

        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            logger.error("User not found for username: {}", auth.getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found");
        }

        existingIncrement.setProgramId(articleIncrement.getProgramId());
        existingIncrement.setArticle(articleIncrement.getArticle().trim());
        existingIncrement.setLastIncrement(articleIncrement.getLastIncrement());

        ArticleIncrement updatedIncrement = repository.save(existingIncrement);
        logger.info("Updated article increment ID: {}", updatedIncrement.getId());
        return updatedIncrement;
    }

    @Override
    public ArticleIncrement getArticleIncrementById(Long id) {
        logger.info("Fetching article increment ID: {}", id);
        Optional<ArticleIncrement> incrementOptional = repository.findById(id);
        if (!incrementOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article increment not found");
        }
        return incrementOptional.get();
    }

    @Override
    public List<ArticleIncrement> getAllArticleIncrements() {
        logger.info("Fetching all article increments");
        return repository.findAll();
    }

    @PreAuthorize("hasRole('ENGINEER')")
    @Override
    public void deleteArticleIncrement(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Deleting article increment ID: {} by user: {}", id, auth != null ? auth.getName() : "none");

        Optional<ArticleIncrement> incrementOptional = repository.findById(id);
        if (!incrementOptional.isPresent()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Article increment not found");
        }

        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        App_user user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            logger.error("User not found for username: {}", auth.getName());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found");
        }

        repository.delete(incrementOptional.get());
        logger.info("Deleted article increment ID: {}", id);
    }

    @Override
    public List<ArticleIncrement> searchArticleIncrements(Long programId, String article) {
        logger.info("Searching article increments with programId: {}, article: {}", programId, article);
        List<ArticleIncrement> increments = repository.findAll();
        if (programId != null) {
            increments = increments.stream()
                .filter(ai -> ai.getProgramId().equals(programId))
                .collect(Collectors.toList());
        }
        if (article != null && !article.trim().isEmpty()) {
            String articleLower = article.trim().toLowerCase();
            increments = increments.stream()
                .filter(ai -> ai.getArticle().toLowerCase().contains(articleLower))
                .collect(Collectors.toList());
        }
        return increments;
    }
}