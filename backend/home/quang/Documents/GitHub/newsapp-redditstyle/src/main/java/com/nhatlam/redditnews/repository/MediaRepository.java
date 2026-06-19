package com.nhatlam.redditnews.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.Media;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByUserIdOrderByCreatedAtDesc(Long userId);
}
