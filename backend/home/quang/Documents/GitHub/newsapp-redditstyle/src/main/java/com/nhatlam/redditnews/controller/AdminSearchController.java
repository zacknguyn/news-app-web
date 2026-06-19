package com.nhatlam.redditnews.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.SearchResultDTO;
import com.nhatlam.redditnews.repository.ArticleRepository;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.security.RequiresActiveAccount;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/search")
@RequiredArgsConstructor
@RequiresActiveAccount
public class AdminSearchController {

    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;
    private final PostRepository postRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SearchResultDTO>>> search(@RequestParam String q) {
        List<SearchResultDTO> results = new ArrayList<>();
        var pageable = PageRequest.of(0, 10);

        userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, pageable)
                .getContent().forEach(user -> results.add(SearchResultDTO.builder()
                        .entityType("user")
                        .id(user.getId())
                        .title(user.getName())
                        .subtitle(user.getEmail())
                        .url("/app/admin?section=users")
                        .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                        .build()));

        articleRepository.searchByKeyword(q, pageable)
                .getContent().forEach(article -> results.add(SearchResultDTO.builder()
                        .entityType("article")
                        .id(article.getId())
                        .title(article.getTitle())
                        .subtitle(article.getSubtitle())
                        .url("/app/p/article-" + article.getId())
                        .status(article.getStatus() != null ? article.getStatus().name() : "PUBLISHED")
                        .build()));

        postRepository.searchByKeyword(q, pageable)
                .getContent().forEach(post -> results.add(SearchResultDTO.builder()
                        .entityType("post")
                        .id(post.getId())
                        .title(post.getTitle())
                        .subtitle(post.getTopic() != null ? post.getTopic().getName() : "")
                        .url("/app/p/" + post.getId())
                        .status("ACTIVE")
                        .build()));

        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
