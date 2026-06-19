package com.nhatlam.redditnews.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.AuthorCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.AuthorDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.AuthorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/authors")
@RequiredArgsConstructor
@RequiresActiveAccount
public class AuthorController {

    private final AuthorService authorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuthorDTO>>> getAll() {
        return ResponseEntity
                .ok(ApiResponse.<List<AuthorDTO>>builder().success(true).data(authorService.getAllAuthors()).build());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<AuthorDTO>> getBySlug(@PathVariable String slug) {
        return ResponseEntity
                .ok(ApiResponse.<AuthorDTO>builder().success(true).data(authorService.getAuthorBySlug(slug)).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AuthorDTO>> create(@RequestBody @Valid AuthorCreateDTO dto) {
        AuthorDTO created = authorService.createAuthor(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<AuthorDTO>builder().success(true).message("Tạo tác giả thành công").data(created).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AuthorDTO>> update(@PathVariable Long id,
            @RequestBody @Valid AuthorCreateDTO dto) {
        return ResponseEntity
                .ok(ApiResponse.<AuthorDTO>builder().success(true).data(authorService.updateAuthor(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        authorService.deleteAuthor(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Xóa tác giả thành công").build());
    }
}
