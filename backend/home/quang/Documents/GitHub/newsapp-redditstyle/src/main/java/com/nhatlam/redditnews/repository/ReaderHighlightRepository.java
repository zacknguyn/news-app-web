package com.nhatlam.redditnews.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.ReaderHighlight;

@Repository
public interface ReaderHighlightRepository extends JpaRepository<ReaderHighlight, Long> {
    List<ReaderHighlight> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ReaderHighlight> findByUserIdAndPostIdOrderByCreatedAtDesc(Long userId, Long postId);

    List<ReaderHighlight> findByUserIdAndArticleIdOrderByCreatedAtDesc(Long userId, Long articleId);

    void deleteByPostId(Long postId);
}
