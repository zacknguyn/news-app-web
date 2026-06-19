package com.nhatlam.redditnews.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.CategoryCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.CategoryDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.CategoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@RequiresActiveAccount
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.<List<CategoryDTO>>builder().success(true)
                .data(categoryService.getAllCategories()).build());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<CategoryDTO>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(
                ApiResponse.<CategoryDTO>builder().success(true).data(categoryService.getCategoryBySlug(slug)).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> create(@RequestBody @Valid CategoryCreateDTO dto) {
        CategoryDTO created = categoryService.createCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CategoryDTO>builder().success(true)
                .message("Tạo danh mục thành công").data(created).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDTO>> update(@PathVariable Long id,
            @RequestBody @Valid CategoryCreateDTO dto) {
        return ResponseEntity.ok(
                ApiResponse.<CategoryDTO>builder().success(true).data(categoryService.updateCategory(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Xóa danh mục thành công").build());
    }
}
