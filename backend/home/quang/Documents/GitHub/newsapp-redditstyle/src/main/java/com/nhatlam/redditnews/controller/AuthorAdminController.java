package com.nhatlam.redditnews.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.AuthorCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.AuthorDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.AuthorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/authors")
@RequiredArgsConstructor
@RequiresActiveAccount
public class AuthorAdminController {

    private final AuthorService authorService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<AuthorDTO>>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuthorDTO> result = authorService.getAuthorsPaginated(search, page, size);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<AuthorDTO>>builder().success(true)
                .data(PaginatedResponse.of(result)).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuthorDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<AuthorDTO>builder().success(true)
                .data(authorService.getAuthorById(id)).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AuthorDTO>> create(@RequestBody @Valid AuthorCreateDTO dto) {
        AuthorDTO created = authorService.createAuthor(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<AuthorDTO>builder().success(true)
                .message("Author created").data(created).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AuthorDTO>> update(@PathVariable Long id,
            @RequestBody @Valid AuthorCreateDTO dto) {
        return ResponseEntity.ok(ApiResponse.<AuthorDTO>builder().success(true)
                .data(authorService.updateAuthor(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        authorService.deleteAuthor(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Author deleted").build());
    }
}
