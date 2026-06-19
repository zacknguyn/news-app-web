package com.nhatlam.redditnews.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.ReaderHighlightCreateDTO;
import com.nhatlam.redditnews.dto.request.ReaderHighlightUpdateDTO;
import com.nhatlam.redditnews.dto.request.ReadingProgressUpdateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.ReaderHighlightDTO;
import com.nhatlam.redditnews.dto.response.ReadingProgressDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.ReaderDataService;
import com.nhatlam.redditnews.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
@RequiresActiveAccount
public class ReaderDataController {
    private final ReaderDataService readerDataService;
    private final UserService userService;

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByEmail(email).getId();
    }

    @GetMapping("/highlights")
    public ResponseEntity<ApiResponse<List<ReaderHighlightDTO>>> getHighlights() {
        return ResponseEntity.ok(ok(readerDataService.getHighlights(getCurrentUserId())));
    }

    @GetMapping("/highlights/post/{postId}")
    public ResponseEntity<ApiResponse<List<ReaderHighlightDTO>>> getHighlightsByPost(@PathVariable Long postId) {
        return ResponseEntity.ok(ok(readerDataService.getHighlightsByPost(getCurrentUserId(), postId)));
    }

    @GetMapping("/highlights/article/{articleId}")
    public ResponseEntity<ApiResponse<List<ReaderHighlightDTO>>> getHighlightsByArticle(@PathVariable Long articleId) {
        return ResponseEntity.ok(ok(readerDataService.getHighlightsByArticle(getCurrentUserId(), articleId)));
    }

    @PostMapping("/highlights")
    public ResponseEntity<ApiResponse<ReaderHighlightDTO>> createHighlight(@Valid @RequestBody ReaderHighlightCreateDTO dto) {
        ReaderHighlightDTO created = readerDataService.createHighlight(getCurrentUserId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ReaderHighlightDTO>builder().success(true).message("Highlight saved").data(created).build());
    }

    @PatchMapping("/highlights/{id}")
    public ResponseEntity<ApiResponse<ReaderHighlightDTO>> updateHighlight(
            @PathVariable Long id,
            @Valid @RequestBody ReaderHighlightUpdateDTO dto) {
        return ResponseEntity.ok(ok(readerDataService.updateHighlight(getCurrentUserId(), id, dto)));
    }

    @DeleteMapping("/highlights/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHighlight(@PathVariable Long id) {
        readerDataService.deleteHighlight(getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Highlight deleted").build());
    }

    @GetMapping("/reading-progress")
    public ResponseEntity<ApiResponse<List<ReadingProgressDTO>>> getReadingProgress() {
        return ResponseEntity.ok(ok(readerDataService.getProgress(getCurrentUserId())));
    }

    @PutMapping("/reading-progress")
    public ResponseEntity<ApiResponse<ReadingProgressDTO>> upsertReadingProgress(
            @Valid @RequestBody ReadingProgressUpdateDTO dto) {
        return ResponseEntity.ok(ok(readerDataService.upsertProgress(getCurrentUserId(), dto)));
    }

    @DeleteMapping("/reading-progress/{postId}")
    public ResponseEntity<ApiResponse<Void>> clearReadingProgress(@PathVariable Long postId) {
        readerDataService.clearProgress(getCurrentUserId(), postId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Reading progress cleared").build());
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
}
