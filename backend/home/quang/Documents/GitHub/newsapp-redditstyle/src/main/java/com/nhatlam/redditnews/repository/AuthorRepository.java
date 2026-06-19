package com.nhatlam.redditnews.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.Author;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
    Optional<Author> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByEmail(String email);

    Page<Author> findAllByOrderByNameAsc(Pageable pageable);

    @Query("SELECT a FROM Author a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Author> findByNameContainingIgnoreCase(String search, Pageable pageable);
}
