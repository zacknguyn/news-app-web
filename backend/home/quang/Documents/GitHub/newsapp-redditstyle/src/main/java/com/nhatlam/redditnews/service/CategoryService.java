package com.nhatlam.redditnews.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.CategoryCreateDTO;
import com.nhatlam.redditnews.dto.response.CategoryDTO;
import com.nhatlam.redditnews.entity.Category;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SlugService slugService;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CategoryDTO> getCategoriesPaginated(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Category> result;
        if (search != null && !search.isBlank()) {
            result = categoryRepository.findByNameContainingIgnoreCase(search, pageable);
        } else {
            result = categoryRepository.findAll(pageable);
        }
        return result.map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        Category c = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục: " + slug));
        return toDTO(c);
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục id: " + id));
        return toDTO(c);
    }

    public CategoryDTO createCategory(CategoryCreateDTO dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new BadRequestException("Tên danh mục đã tồn tại: " + dto.getName());
        }

        String slug = (dto.getSlug() != null && !dto.getSlug().isBlank())
                ? dto.getSlug()
                : slugService.toSlug(dto.getName());

        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Slug danh mục đã tồn tại: " + slug);
        }

        Category category = Category.builder().name(dto.getName()).slug(slug).description(dto.getDescription()).build();
        return toDTO(categoryRepository.save(category));
    }

    public CategoryDTO updateCategory(Long id, CategoryCreateDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục id: " + id));

        if (dto.getName() != null && !dto.getName().isBlank()) {
            category.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            category.setDescription(dto.getDescription());
        }
        if (dto.getSlug() != null && !dto.getSlug().isBlank()) {
            category.setSlug(dto.getSlug());
        }
        return toDTO(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy danh mục id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDTO toDTO(Category c) {
        return CategoryDTO.builder().id(c.getId()).name(c.getName()).slug(c.getSlug()).description(c.getDescription())
                .articleCount((long) c.getArticles().size()).build();
    }
}
