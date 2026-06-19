package com.nhatlam.redditnews.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.TagCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.dto.response.TagDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.TagService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/tags")
@RequiredArgsConstructor
@RequiresActiveAccount
public class TagAdminController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<TagDTO>>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TagDTO> result = tagService.getTagsPaginated(search, page, size);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<TagDTO>>builder().success(true)
                .data(PaginatedResponse.of(result)).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<TagDTO>builder().success(true)
                .data(tagService.getTagById(id)).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagDTO>> create(@RequestBody @Valid TagCreateDTO dto) {
        TagDTO created = tagService.createTag(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<TagDTO>builder().success(true)
                .message("Tag created").data(created).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> update(@PathVariable Long id,
            @RequestBody @Valid TagCreateDTO dto) {
        return ResponseEntity.ok(ApiResponse.<TagDTO>builder().success(true)
                .data(tagService.updateTag(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Tag deleted").build());
    }
}
