package com.nhatlam.redditnews.service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.ArticleCreateDTO;
import com.nhatlam.redditnews.dto.request.ArticleUpdateDTO;
import com.nhatlam.redditnews.dto.request.SummarizeArticleRequestDTO;
import com.nhatlam.redditnews.dto.response.*;
import com.nhatlam.redditnews.config.AiProperties;
import com.nhatlam.redditnews.entity.*;
import com.nhatlam.redditnews.entity.Article.ArticleStatus;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.*;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CommentRepository commentRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final SlugService slugService;
    private final RecommendationService recommendationService;
    private final AiSummarizationClient aiSummarizationClient;
    private final AiProperties aiProperties;

    @Transactional(readOnly = true)
    public List<ArticleDTO> getTrending(int limit) {
        Pageable p = PageRequest.of(0, limit);
        return articleRepository.findTrendingByViewsToday(p).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArticleDTO> getEditorsPicks() {
        return articleRepository.findTop10ByIsEditorsPickTrueAndStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArticleDTO> getFeatured() {
        return articleRepository.findTop6ByIsFeaturedTrueAndStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArticleDTO> getLatest(int limit) {
        return articleRepository.findTop20ByStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED).stream().limit(limit)
                .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArticleDTO> getRecommended(Long userId, int limit) {
        int safeLimit = Math.max(1, limit);
        List<Article> recommendedArticles = recommendationService.recommendArticles(userId, safeLimit);
        if (recommendedArticles.isEmpty()) {
            return getTrending(safeLimit);
        }
        return recommendedArticles.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ArticleDTO getBySlug(String slug) {
        Article article = articleRepository.findBySlugAndStatus(slug, ArticleStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết: " + slug));
        return toDTO(article);
    }

    @Transactional(readOnly = true)
    public ArticleDTO getArticleById(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết id: " + id));
        return toDTO(article);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticleDTO> getAllArticles(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        return paginate(articleRepository.findAll(pageable));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticleDTO> getPublishedArticles(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        return paginate(articleRepository.findByStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED, pageable));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticleDTO> getByCategory(String slug, int page, int size) {
        return paginate(articleRepository.findByCategorySlug(slug, PageRequest.of(page, size)));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticleDTO> getByUser(Long userId, int page, int size) {
        return paginate(articleRepository.findByUserId(userId, PageRequest.of(page, size)));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticleDTO> getByTag(String slug, int page, int size) {
        return paginate(articleRepository.findByTagSlug(slug, PageRequest.of(page, size)));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ArticleDTO> searchArticles(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        return paginate(articleRepository.searchByKeyword(keyword, pageable));
    }

    public ArticleDTO createArticle(ArticleCreateDTO dto) {
        String slug = resolveSlug(dto.getSlug(), dto.getTitle(), null);

        Article article = Article.builder().title(dto.getTitle()).subtitle(dto.getSubtitle()).content(dto.getContent())
                .aiSummary(dto.getAiSummary()).imageUrl(dto.getImageUrl()).readTime(dto.getReadTime()).slug(slug).publishedAt(LocalDateTime.now())
                .isFeatured(dto.getIsFeatured() != null && dto.getIsFeatured())
                .isEditorsPick(dto.getIsEditorsPick() != null && dto.getIsEditorsPick())
                .status(parseStatus(dto.getStatus())).build();

        if (dto.getUserId() != null) {
            userRepository.findById(dto.getUserId()).ifPresent(article::setUser);
        }
        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            article.setCategories(fetchCategories(dto.getCategoryIds()));
        }
        if (dto.getTagIds() != null && !dto.getTagIds().isEmpty()) {
            article.setTags(fetchTags(dto.getTagIds()));
        }

        return toDTO(articleRepository.save(article));
    }

    public ArticleDTO updateArticle(Long id, ArticleUpdateDTO dto) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết id: " + id));

        if (dto.getTitle() != null && !dto.getTitle().isBlank())
            article.setTitle(dto.getTitle());
        if (dto.getSubtitle() != null)
            article.setSubtitle(dto.getSubtitle());
        if (dto.getContent() != null && !dto.getContent().isBlank())
            article.setContent(dto.getContent());
        if (dto.getAiSummary() != null)
            article.setAiSummary(dto.getAiSummary().isBlank() ? null : dto.getAiSummary());
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank())
            article.setImageUrl(dto.getImageUrl());
        if (dto.getReadTime() != null)
            article.setReadTime(dto.getReadTime());
        if (dto.getIsFeatured() != null)
            article.setIsFeatured(dto.getIsFeatured());
        if (dto.getIsEditorsPick() != null)
            article.setIsEditorsPick(dto.getIsEditorsPick());
        if (dto.getStatus() != null)
            article.setStatus(parseStatus(dto.getStatus()));
        if (dto.getUserId() != null)
            userRepository.findById(dto.getUserId()).ifPresent(article::setUser);
        if (dto.getCategoryIds() != null)
            article.setCategories(
                    dto.getCategoryIds().isEmpty() ? new ArrayList<>() : fetchCategories(dto.getCategoryIds()));
        if (dto.getTagIds() != null)
            article.setTags(dto.getTagIds().isEmpty() ? new ArrayList<>() : fetchTags(dto.getTagIds()));

        return toDTO(articleRepository.save(article));
    }

    public ArticleDTO summarizeArticle(Long id, Integer maxPoints, String language, Boolean force) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết id: " + id));

        if (!Boolean.TRUE.equals(force) && article.getAiSummary() != null && !article.getAiSummary().isBlank()) {
            return toDTO(article);
        }

        int bulletCount = maxPoints != null ? Math.max(1, Math.min(maxPoints, 12)) : aiProperties.getSummaryMaxBullets();
        SummarizeArticleRequestDTO request = SummarizeArticleRequestDTO
                .builder()
                .text(article.getContent())
                .maxBullets(bulletCount)
                .maxPoints(bulletCount)
                .language(language != null && !language.isBlank() ? language : "vi")
                .maxNewTokens(aiProperties.getSummaryMaxNewTokens())
                .temperature(aiProperties.getSummaryTemperature())
                .topP(aiProperties.getSummaryTopP())
                .build();

        article.setAiSummary(aiSummarizationClient.summarize(request));
        return toDTO(articleRepository.save(article));
    }

    public void deleteArticle(Long id) {
        if (!articleRepository.existsById(id))
            throw new ResourceNotFoundException("Không tìm thấy bài viết id: " + id);
        articleRepository.deleteById(id);
    }

    public void incrementViews(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết id: " + id));
        article.incrementViews();
        articleRepository.save(article);
    }

    private ArticleDTO toDTO(Article a) {
        long commentCount = commentRepository.countByArticleId(a.getId());

        List<CategoryDTO> categories = a.getCategories().stream().map(c -> CategoryDTO.builder().id(c.getId())
                .name(c.getName()).slug(c.getSlug()).description(c.getDescription()).build())
                .collect(Collectors.toList());

        List<TagDTO> tags = a.getTags().stream()
                .map(t -> TagDTO.builder().id(t.getId()).name(t.getName()).slug(t.getSlug()).build())
                .collect(Collectors.toList());

        return ArticleDTO.builder().id(a.getId()).title(a.getTitle()).subtitle(a.getSubtitle()).content(a.getContent())
                .aiSummary(a.getAiSummary()).slug(a.getSlug()).imageUrl(a.getImageUrl()).publishedAt(a.getPublishedAt()).readTime(a.getReadTime())
                .views(a.getViews()).viewsToday(a.getViewsToday()).viewsWeek(a.getViewsWeek())
                .viewsMonth(a.getViewsMonth()).commentsCount(commentCount)
                .status(a.getStatus() != null ? a.getStatus().name() : null).isFeatured(a.getIsFeatured())
                .isEditorsPick(a.getIsEditorsPick()).userId(a.getUser() != null ? a.getUser().getId() : null)
                .authorName(a.getUser() != null ? a.getUser().getName() : null)
                .authorAvatar(a.getUser() != null ? a.getUser().getAvatar() : null).categories(categories).tags(tags)
                .build();
    }

    private PaginatedResponse<ArticleDTO> paginate(Page<Article> page) {
        return PaginatedResponse.<ArticleDTO>builder()
                .content(page.getContent().stream().map(this::toDTO).collect(Collectors.toList()))
                .pageNumber(page.getNumber()).pageSize(page.getSize()).totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages()).last(page.isLast()).build();
    }

    private String resolveSlug(String provided, String title, Long existingId) {
        String base = (provided != null && !provided.isBlank())
                ? slugService.toSlug(provided)
                : slugService.toSlug(title);
        String slug = base;
        int suffix = 1;
        while (existingId != null
                ? articleRepository.existsBySlugAndIdNot(slug, existingId)
                : articleRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private List<Category> fetchCategories(List<Long> ids) {
        List<Category> result = categoryRepository.findAllById(ids);
        if (result.size() != ids.size())
            throw new BadRequestException("Một hoặc nhiều danh mục không tồn tại");
        return result;
    }

    private List<Tag> fetchTags(List<Long> ids) {
        return tagRepository.findAllById(ids);
    }

    private ArticleStatus parseStatus(String s) {
        if (s == null)
            return ArticleStatus.PUBLISHED;
        try {
            return ArticleStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ArticleStatus.PUBLISHED;
        }
    }
}
