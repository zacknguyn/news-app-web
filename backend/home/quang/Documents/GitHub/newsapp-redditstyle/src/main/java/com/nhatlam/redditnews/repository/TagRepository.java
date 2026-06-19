package com.nhatlam.redditnews.repository;

import java.util.List;
import java.util.Optional;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.Tag;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findBySlug(String slug);

    Optional<Tag> findByName(String name);

    boolean existsBySlug(String slug);

    boolean existsByName(String name);

    List<Tag> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    Page<Tag> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT t FROM Tag t LEFT JOIN t.articles a GROUP BY t ORDER BY COUNT(a) DESC")
    Page<Tag> findAllOrderByArticleCountDesc(Pageable pageable);
}
