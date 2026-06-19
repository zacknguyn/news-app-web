package com.nhatlam.redditnews.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import org.hibernate.annotations.CreationTimestamp;

import lombok.*;

@Entity
@Table(name = "article_view_logs", indexes = {@Index(name = "idx_avl_article_id", columnList = "article_id"),
        @Index(name = "idx_avl_viewed_at", columnList = "viewed_at")})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleViewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "article_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Article article;

    @CreationTimestamp
    @Column(name = "viewed_at", nullable = false, updatable = false)
    private LocalDateTime viewedAt;
}
