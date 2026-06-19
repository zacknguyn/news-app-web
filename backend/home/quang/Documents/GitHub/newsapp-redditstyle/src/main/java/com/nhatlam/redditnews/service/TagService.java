package com.nhatlam.redditnews.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.TagCreateDTO;
import com.nhatlam.redditnews.dto.response.TagDTO;
import com.nhatlam.redditnews.entity.Tag;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.TagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TagService {

    private final TagRepository tagRepository;
    private final SlugService slugService;

    @Transactional(readOnly = true)
    public List<TagDTO> getAllTags() {
        return tagRepository.findAllOrderByArticleCountDesc(PageRequest.of(0, 200)).getContent().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TagDTO getTagBySlug(String slug) {
        Tag tag = tagRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tag: " + slug));
        return toDTO(tag);
    }

    @Transactional(readOnly = true)
    public TagDTO getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tag id: " + id));
        return toDTO(tag);
    }

    public TagDTO createTag(TagCreateDTO dto) {
        if (tagRepository.existsByName(dto.getName())) {
            throw new BadRequestException("Tag đã tồn tại: " + dto.getName());
        }
        String slug = (dto.getSlug() != null && !dto.getSlug().isBlank())
                ? dto.getSlug()
                : slugService.toSlug(dto.getName());

        if (tagRepository.existsBySlug(slug)) {
            throw new BadRequestException("Slug tag đã tồn tại: " + slug);
        }

        Tag tag = Tag.builder().name(dto.getName()).slug(slug).build();
        return toDTO(tagRepository.save(tag));
    }

    public TagDTO updateTag(Long id, TagCreateDTO dto) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tag id: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            tag.setName(dto.getName());
        if (dto.getSlug() != null && !dto.getSlug().isBlank())
            tag.setSlug(dto.getSlug());
        return toDTO(tagRepository.save(tag));
    }

    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy tag id: " + id);
        }
        tagRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<TagDTO> getTagsPaginated(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Tag> result;
        if (search != null && !search.isBlank()) {
            result = tagRepository.findByNameContainingIgnoreCase(search, pageable);
        } else {
            result = tagRepository.findAll(pageable);
        }
        return result.map(this::toDTO);
    }

    public TagDTO toDTO(Tag t) {
        return TagDTO.builder().id(t.getId()).name(t.getName()).slug(t.getSlug())
                .articleCount((long) t.getArticles().size()).build();
    }
}
