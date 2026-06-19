package com.nhatlam.redditnews.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.Article;
import com.nhatlam.redditnews.entity.Article.ArticleStatus;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    // ── Slug ──────────────────────────────────────────────────────────────────
    Optional<Article> findBySlugAndStatus(String slug, ArticleStatus status);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    // ── Listing & Pagination ─────────────────────────────────────────────────
    Page<Article> findByStatusOrderByPublishedAtDesc(ArticleStatus status, Pageable pageable);

    // ── Category (M2M) ───────────────────────────────────────────────────────
    @Query("SELECT a FROM Article a JOIN a.categories c WHERE c.slug = :slug AND a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    Page<Article> findByCategorySlug(@Param("slug") String slug, Pageable pageable);

    // ── By user (author) ─────────────────────────────────────────────────────
    @Query("SELECT a FROM Article a WHERE a.user.id = :userId AND a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    Page<Article> findByUserId(@Param("userId") Long userId, Pageable pageable);

    // ── Tag ───────────────────────────────────────────────────────────────────
    @Query("SELECT a FROM Article a JOIN a.tags t WHERE t.slug = :slug AND a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    Page<Article> findByTagSlug(@Param("slug") String slug, Pageable pageable);

    // ── Search ───────────────────────────────────────────────────────────────
    @Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' AND ("
            + "LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(a.subtitle) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Article> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // ── Featured / Editor's Picks ─────────────────────────────────────────────
    List<Article> findTop6ByIsFeaturedTrueAndStatusOrderByPublishedAtDesc(ArticleStatus status);

    List<Article> findTop10ByIsEditorsPickTrueAndStatusOrderByPublishedAtDesc(ArticleStatus status);

    // ── Trending: top by viewsToday, fallback to total views ─────────────────
    @Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' ORDER BY a.viewsToday DESC, a.views DESC")
    List<Article> findTrendingByViewsToday(Pageable pageable);

    // ── Latest ────────────────────────────────────────────────────────────────
    List<Article> findTop20ByStatusOrderByPublishedAtDesc(ArticleStatus status);

    // ── Legacy fallback ───────────────────────────────────────────────────────
    Optional<Article> findByIdAndStatus(Long id, ArticleStatus status);
}
