package com.nhatlam.redditnews.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.AuthorCreateDTO;
import com.nhatlam.redditnews.dto.response.AuthorDTO;
import com.nhatlam.redditnews.entity.Author;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.AuthorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthorService {

    private final AuthorRepository authorRepository;
    private final SlugService slugService;

    @Transactional(readOnly = true)
    public List<AuthorDTO> getAllAuthors() {
        Page<Author> page = authorRepository.findAllByOrderByNameAsc(PageRequest.of(0, 100));
        return page.getContent().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuthorDTO getAuthorBySlug(String slug) {
        Author a = authorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả: " + slug));
        return toDTO(a);
    }

    @Transactional(readOnly = true)
    public AuthorDTO getAuthorById(Long id) {
        Author a = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả id: " + id));
        return toDTO(a);
    }

    public AuthorDTO createAuthor(AuthorCreateDTO dto) {
        String slug = (dto.getSlug() != null && !dto.getSlug().isBlank())
                ? dto.getSlug()
                : slugService.toSlug(dto.getName());

        if (authorRepository.existsBySlug(slug)) {
            throw new BadRequestException("Slug tác giả đã tồn tại: " + slug);
        }

        Author author = Author.builder().name(dto.getName()).slug(slug).bio(dto.getBio()).avatarUrl(dto.getAvatarUrl())
                .email(dto.getEmail()).facebookUrl(dto.getFacebookUrl()).twitterUrl(dto.getTwitterUrl()).build();
        return toDTO(authorRepository.save(author));
    }

    public AuthorDTO updateAuthor(Long id, AuthorCreateDTO dto) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác giả id: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            author.setName(dto.getName());
        if (dto.getBio() != null)
            author.setBio(dto.getBio());
        if (dto.getAvatarUrl() != null)
            author.setAvatarUrl(dto.getAvatarUrl());
        if (dto.getEmail() != null)
            author.setEmail(dto.getEmail());
        if (dto.getFacebookUrl() != null)
            author.setFacebookUrl(dto.getFacebookUrl());
        if (dto.getTwitterUrl() != null)
            author.setTwitterUrl(dto.getTwitterUrl());
        if (dto.getSlug() != null && !dto.getSlug().isBlank())
            author.setSlug(dto.getSlug());

        return toDTO(authorRepository.save(author));
    }

    public void deleteAuthor(Long id) {
        if (!authorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy tác giả id: " + id);
        }
        authorRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<AuthorDTO> getAuthorsPaginated(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Author> result;
        if (search != null && !search.isBlank()) {
            result = authorRepository.findByNameContainingIgnoreCase(search, pageable);
        } else {
            result = authorRepository.findAll(pageable);
        }
        return result.map(this::toDTO);
    }

    public AuthorDTO toDTO(Author a) {
        return AuthorDTO.builder().id(a.getId()).name(a.getName()).slug(a.getSlug()).bio(a.getBio())
                .avatarUrl(a.getAvatarUrl()).email(a.getEmail()).facebookUrl(a.getFacebookUrl())
                .twitterUrl(a.getTwitterUrl()).articleCount((long) a.getArticles().size()).build();
    }
}
