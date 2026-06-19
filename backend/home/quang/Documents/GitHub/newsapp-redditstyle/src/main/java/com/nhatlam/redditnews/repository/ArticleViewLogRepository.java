package com.nhatlam.redditnews.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.ArticleViewLog;

@Repository
public interface ArticleViewLogRepository extends JpaRepository<ArticleViewLog, Long> {

    long countByArticleId(Long articleId);

    @Query("SELECT COUNT(v) FROM ArticleViewLog v WHERE v.article.id = :articleId AND v.viewedAt >= :since")
    long countByArticleIdAndViewedAtAfter(@Param("articleId") Long articleId, @Param("since") LocalDateTime since);
}
