package com.nhatlam.redditnews.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByArticleIdOrderByCreatedAtDesc(Long articleId);

    Page<Comment> findByArticleIdOrderByCreatedAtDesc(Long articleId, Pageable pageable);

    List<Comment> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByArticleId(Long articleId);
    long countByPostId(Long postId);

    List<Comment> findByArticleIdAndParentIsNullOrderByCreatedAtDesc(Long articleId);
    Page<Comment> findByArticleIdAndParentIsNullOrderByCreatedAtDesc(Long articleId, Pageable pageable);
    List<Comment> findByPostIdAndParentIsNullOrderByCreatedAtDesc(Long postId);
    Page<Comment> findByPostIdAndParentIsNullOrderByCreatedAtDesc(Long postId, Pageable pageable);
}
