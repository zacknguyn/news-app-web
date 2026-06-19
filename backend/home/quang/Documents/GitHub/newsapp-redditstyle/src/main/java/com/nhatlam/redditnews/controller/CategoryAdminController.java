package com.nhatlam.redditnews.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.CategoryCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.CategoryDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.CategoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@RequiresActiveAccount
public class CategoryAdminController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<CategoryDTO>>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CategoryDTO> result = categoryService.getCategoriesPaginated(search, page, size);
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<CategoryDTO>>builder().success(true)
                .data(PaginatedResponse.of(result)).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<CategoryDTO>builder().success(true)
                .data(categoryService.getCategoryById(id)).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> create(@RequestBody @Valid CategoryCreateDTO dto) {
        CategoryDTO created = categoryService.createCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CategoryDTO>builder().success(true)
                .message("Category created").data(created).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDTO>> update(@PathVariable Long id,
            @RequestBody @Valid CategoryCreateDTO dto) {
        return ResponseEntity.ok(ApiResponse.<CategoryDTO>builder().success(true)
                .data(categoryService.updateCategory(id, dto)).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Category deleted").build());
    }
}
