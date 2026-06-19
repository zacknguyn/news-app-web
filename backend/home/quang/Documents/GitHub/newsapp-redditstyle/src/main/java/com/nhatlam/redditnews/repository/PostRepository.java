package com.nhatlam.redditnews.repository;

import com.nhatlam.redditnews.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByTopicId(Long topicId, Pageable pageable);
    long countByTopicId(Long topicId);
    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query(value = "SELECT * FROM posts p ORDER BY " +
            "LOG(GREATEST(1, ABS(p.score))) + " +
            "(SIGN(p.score) * EXTRACT(EPOCH FROM p.created_at)) / 45000 DESC",
            nativeQuery = true)
    Page<Post> findHotPosts(Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.score), 0) FROM Post p WHERE p.user.id = :userId")
    int getAccumulatedScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM Post p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
