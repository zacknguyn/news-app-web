package com.nhatlam.redditnews.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.SavedArticle;

@Repository
public interface SavedArticleRepository extends JpaRepository<SavedArticle, Long> {

    @Query("SELECT sa FROM SavedArticle sa JOIN FETCH sa.article WHERE sa.user.id = :userId ORDER BY sa.savedAt DESC")
    List<SavedArticle> findByUserIdOrderBySavedAtDesc(@Param("userId") Long userId);

    boolean existsByUserIdAndArticleId(Long userId, Long articleId);

    Optional<SavedArticle> findByUserIdAndArticleId(Long userId, Long articleId);

    void deleteByUserIdAndArticleId(Long userId, Long articleId);
}
