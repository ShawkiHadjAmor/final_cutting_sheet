package com.backend.cuttingsheet.interfaces;

import com.backend.cuttingsheet.entity.ArticleIncrement;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/article-increments")
public interface IArticleIncrementApi {
    @PostMapping
    ArticleIncrement createArticleIncrement(
        @RequestBody ArticleIncrement articleIncrement
    );

    @PutMapping("/{id}")
    ArticleIncrement updateArticleIncrement(
        @PathVariable Long id,
        @RequestBody ArticleIncrement articleIncrement
    );

    @GetMapping("/{id}")
    ArticleIncrement getArticleIncrementById(@PathVariable Long id);

    @GetMapping
    List<ArticleIncrement> getAllArticleIncrements();

    @DeleteMapping("/{id}")
    void deleteArticleIncrement(@PathVariable Long id);

    @GetMapping("/search")
    List<ArticleIncrement> searchArticleIncrements(
        @RequestParam(required = false) Long programId,
        @RequestParam(required = false) String article
    );
}