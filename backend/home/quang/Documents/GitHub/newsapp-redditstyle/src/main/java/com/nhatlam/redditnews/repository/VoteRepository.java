package com.nhatlam.redditnews.repository;

import com.nhatlam.redditnews.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByUserIdAndPostId(Long userId, Long postId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    long countByPostId(Long postId);
    @Query("SELECT v.post.topic.name FROM Vote v WHERE v.user.id = :userId AND v.voteType = 1 GROUP BY v.post.topic.name ORDER BY COUNT(v) DESC")
    List<String> findTopUpvotedTopicsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT v.post.user.name FROM Vote v WHERE v.user.id = :userId AND v.voteType = 1 GROUP BY v.post.user.name ORDER BY COUNT(v) DESC")
    List<String> findFavoriteAuthorsByUserId(@Param("userId") Long userId, Pageable pageable);

    void deleteByPostId(Long postId);
}
