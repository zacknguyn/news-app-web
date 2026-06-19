package com.nhatlam.redditnews.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.TagCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.TagDTO;
import com.nhatlam.redditnews.repository.TagRepository;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.TagService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
@RequiresActiveAccount
public class TagController {

    private final TagService tagService;
    private final TagRepository tagRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagDTO>>> getAll(
            @RequestParam(required = false, defaultValue = "") String search) {
        List<TagDTO> tags;
        if (search.isBlank()) {
            tags = tagService.getAllTags();
        } else {
            tags = tagRepository.findByNameContainingIgnoreCaseOrderByNameAsc(search)
                    .stream()
                    .map(tagService::toDTO)
                    .toList();
        }
        return ResponseEntity.ok(ApiResponse.<List<TagDTO>>builder().success(true).data(tags).build());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<TagDTO>> getBySlug(@PathVariable String slug) {
        return ResponseEntity
                .ok(ApiResponse.<TagDTO>builder().success(true).data(tagService.getTagBySlug(slug)).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagDTO>> create(@RequestBody @Valid TagCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<TagDTO>builder().success(true).data(tagService.createTag(dto)).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> update(@PathVariable Long id, @RequestBody @Valid TagCreateDTO dto) {
        return ResponseEntity
                .ok(ApiResponse.<TagDTO>builder().success(true).data(tagService.updateTag(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Xóa tag thành công").build());
    }
}
