package com.nhatlam.redditnews.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.config.AiProperties;
import com.nhatlam.redditnews.dto.request.CandidateArticleDTO;
import com.nhatlam.redditnews.dto.request.RecommendationRequestDTO;
import com.nhatlam.redditnews.dto.request.UserPreferenceDTO;
import com.nhatlam.redditnews.entity.Article;
import com.nhatlam.redditnews.entity.Article.ArticleStatus;
import com.nhatlam.redditnews.entity.Category;
import com.nhatlam.redditnews.entity.Tag;
import com.nhatlam.redditnews.repository.ArticleRepository;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.repository.VoteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private static final int NOTEBOOK_MAX_RECOMMENDATIONS = 10;
    private static final int PREFERENCE_LIMIT = 5;

    private final ArticleRepository articleRepository;
    private final VoteRepository voteRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final AiRecommendationClient aiRecommendationClient;
    private final AiProperties aiProperties;

    public List<Article> recommendArticles(Long userId, int requestedLimit) {
        int limit = clamp(requestedLimit, 1, NOTEBOOK_MAX_RECOMMENDATIONS);
        int candidateLimit = Math.max(limit, aiProperties.getCandidateLimit());
        List<Article> candidates = articleRepository
                .findByStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED, PageRequest.of(0, candidateLimit))
                .getContent();

        if (candidates.isEmpty()) {
            return List.of();
        }

        RecommendationRequestDTO request = RecommendationRequestDTO.builder()
                .userPreference(buildUserPreference(userId))
                .candidateArticles(candidates.stream().map(this::toCandidate).toList()).numRecommendations(limit)
                .build();

        List<String> recommendedIds = aiRecommendationClient.recommend(request);
        if (recommendedIds.isEmpty()) {
            return List.of();
        }

        Map<String, Article> candidatesById = new LinkedHashMap<>();
        candidates.forEach(article -> candidatesById.put(String.valueOf(article.getId()), article));

        List<Article> ordered = new ArrayList<>();
        for (String recommendedId : recommendedIds) {
            Article article = candidatesById.get(recommendedId);
            if (article != null && ordered.stream().noneMatch(existing -> existing.getId().equals(article.getId()))) {
                ordered.add(article);
            }
            if (ordered.size() >= limit) {
                break;
            }
        }
        return ordered;
    }

    private UserPreferenceDTO buildUserPreference(Long userId) {
        if (userId == null) {
            return UserPreferenceDTO.builder().topUpvotedTopics(List.of()).favoriteAuthors(List.of()).build();
        }

        List<String> topUpvotedTopics = voteRepository.findTopUpvotedTopicsByUserId(userId,
                PageRequest.of(0, PREFERENCE_LIMIT));
        if (topUpvotedTopics.isEmpty()) {
            topUpvotedTopics = userRepository.findById(userId)
                    .map(user -> user.getFavoriteTopics() != null ? user.getFavoriteTopics() : List.<String>of())
                    .orElse(List.of()).stream().filter(Objects::nonNull).filter(topic -> !topic.isBlank())
                    .limit(PREFERENCE_LIMIT).toList();
        }

        List<String> favoriteAuthors = voteRepository.findFavoriteAuthorsByUserId(userId,
                PageRequest.of(0, PREFERENCE_LIMIT));

        return UserPreferenceDTO.builder().topUpvotedTopics(topUpvotedTopics).favoriteAuthors(favoriteAuthors).build();
    }

    private CandidateArticleDTO toCandidate(Article article) {
        return CandidateArticleDTO.builder().id(String.valueOf(article.getId())).title(article.getTitle())
                .topics(extractTopics(article))
                .author(article.getUser() != null ? article.getUser().getName() : fallbackAuthor(article))
                .authorScore(article.getUser() != null
                        ? postRepository.getAccumulatedScoreByUserId(article.getUser().getId())
                        : 0)
                .build();
    }

    private List<String> extractTopics(Article article) {
        List<String> topics = new ArrayList<>();
        article.getCategories().stream().map(Category::getName).filter(Objects::nonNull).forEach(topics::add);
        article.getTags().stream().map(Tag::getName).filter(Objects::nonNull).forEach(topics::add);
        return topics;
    }

    private String fallbackAuthor(Article article) {
        if (article.getAuthor() != null && !article.getAuthor().isBlank()) {
            return article.getAuthor();
        }
        return "Newsroom";
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
