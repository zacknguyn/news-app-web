package com.nhatlam.redditnews.repository;

import com.nhatlam.redditnews.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    Optional<Topic> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
