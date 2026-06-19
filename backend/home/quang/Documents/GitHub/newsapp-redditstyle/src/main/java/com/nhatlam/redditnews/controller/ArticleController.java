package com.nhatlam.redditnews.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.ArticleCreateDTO;
import com.nhatlam.redditnews.dto.request.ArticleUpdateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.ArticleDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.ArticleService;
import com.nhatlam.redditnews.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
@Tag(name = "Articles", description = "Quản lý bài viết")
public class ArticleController {

    private final ArticleService articleService;
    private final UserService userService;

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ArticleDTO>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ok(articleService.getBySlug(slug)));
    }

    @GetMapping("/recommended")
    public ResponseEntity<ApiResponse<List<ArticleDTO>>> getRecommended(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ok(articleService.getRecommended(getOptionalCurrentUserId(), limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ok(articleService.getArticleById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ArticleDTO>>> getPublished(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ok(articleService.getPublishedArticles(page, size)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<PaginatedResponse<ArticleDTO>>> getAll(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ok(articleService.getAllArticles(page, size)));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<ArticleDTO>>> getTrending(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ok(articleService.getTrending(limit)));
    }

    @GetMapping("/editors-picks")
    public ResponseEntity<ApiResponse<List<ArticleDTO>>> getEditorsPicks() {
        return ResponseEntity.ok(ok(articleService.getEditorsPicks()));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ArticleDTO>>> getFeatured() {
        return ResponseEntity.ok(ok(articleService.getFeatured()));
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<ArticleDTO>>> getLatest(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ok(articleService.getLatest(limit)));
    }

    @GetMapping("/by-category/{slug}")
    public ResponseEntity<ApiResponse<PaginatedResponse<ArticleDTO>>> getByCategory(@PathVariable String slug,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ok(articleService.getByCategory(slug, page, size)));
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<ApiResponse<PaginatedResponse<ArticleDTO>>> getByUser(@PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ok(articleService.getByUser(userId, page, size)));
    }

    @GetMapping("/by-tag/{slug}")
    public ResponseEntity<ApiResponse<PaginatedResponse<ArticleDTO>>> getByTag(@PathVariable String slug,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ok(articleService.getByTag(slug, page, size)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PaginatedResponse<ArticleDTO>>> search(@RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ok(articleService.searchArticles(keyword, page, size)));
    }

    @PostMapping("/{id}/summary")
    @RequiresActiveAccount
    public ResponseEntity<ApiResponse<ArticleDTO>> summarizeArticle(
            @PathVariable Long id,
            @RequestParam(required = false) Integer maxPoints,
            @RequestParam(defaultValue = "vi") String language,
            @RequestParam(defaultValue = "false") Boolean force) {
        return ResponseEntity.ok(ok(articleService.summarizeArticle(id, maxPoints, language, force)));
    }

    @PostMapping("/{id}/view")
    @Operation(summary = "Tăng lượt xem bài viết")
    public ResponseEntity<ApiResponse<Void>> incrementViews(@PathVariable Long id) {
        articleService.incrementViews(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("OK").build());
    }

    @PostMapping
    @RequiresActiveAccount
    public ResponseEntity<ApiResponse<ArticleDTO>> create(@RequestBody @Valid ArticleCreateDTO dto) {
        ArticleDTO created = articleService.createArticle(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ArticleDTO>builder().success(true)
                .message("Tạo bài viết thành công").data(created).build());
    }

    @PutMapping("/{id}")
    @RequiresActiveAccount
    public ResponseEntity<ApiResponse<ArticleDTO>> update(@PathVariable Long id,
            @RequestBody @Valid ArticleUpdateDTO dto) {
        return ResponseEntity.ok(ok(articleService.updateArticle(id, dto)));
    }

    @DeleteMapping("/{id}")
    @RequiresActiveAccount
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Xóa bài viết thành công").build());
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }

    private Long getOptionalCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return userService.getUserByEmail(authentication.getName()).getId();
    }
}
