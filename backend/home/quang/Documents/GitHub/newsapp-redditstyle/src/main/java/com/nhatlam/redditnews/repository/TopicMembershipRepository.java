package com.nhatlam.redditnews.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhatlam.redditnews.entity.TopicMembership;

public interface TopicMembershipRepository extends JpaRepository<TopicMembership, Long> {
    boolean existsByTopicIdAndUserId(Long topicId, Long userId);

    Optional<TopicMembership> findByTopicIdAndUserId(Long topicId, Long userId);

    List<TopicMembership> findByUserIdOrderByJoinedAtDesc(Long userId);
}
