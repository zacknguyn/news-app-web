package com.nhatlam.redditnews.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

import org.hibernate.annotations.CreationTimestamp;

import lombok.*;

@Entity
@Table(name = "articles", indexes = {@Index(name = "idx_articles_slug", columnList = "slug"),
        @Index(name = "idx_articles_user_id", columnList = "user_id"),
        @Index(name = "idx_articles_status", columnList = "status"),
        @Index(name = "idx_articles_featured", columnList = "is_featured"),
        @Index(name = "idx_articles_editors_pick", columnList = "is_editors_pick"),
        @Index(name = "idx_published_at", columnList = "published_at")})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 1000)
    private String subtitle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    // Legacy plain-text fields kept for Liquibase compat (v1 schema)
    @Column(length = 100)
    private String author;

    @Column(length = 500)
    private String authorAvatar;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, unique = true, length = 600)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ArticleStatus status = ArticleStatus.PUBLISHED;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "is_editors_pick", nullable = false)
    @Builder.Default
    private Boolean isEditorsPick = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "article_category_map", joinColumns = @JoinColumn(name = "article_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Category> categories = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "article_tag_map", joinColumns = @JoinColumn(name = "article_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Tag> tags = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Long views = 0L;

    @Column(name = "views_today", nullable = false)
    @Builder.Default
    private Integer viewsToday = 0;

    @Column(name = "views_week", nullable = false)
    @Builder.Default
    private Integer viewsWeek = 0;

    @Column(name = "views_month", nullable = false)
    @Builder.Default
    private Integer viewsMonth = 0;

    @Column(nullable = false)
    private LocalDateTime publishedAt;

    @Column(nullable = false)
    private Integer readTime;

    @Column(nullable = false)
    private String imageUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<SavedArticle> savedByUsers = new ArrayList<>();

    public void incrementViews() {
        this.views++;
        this.viewsToday++;
        this.viewsWeek++;
        this.viewsMonth++;
    }

    public enum ArticleStatus {
        DRAFT, PUBLISHED
    }
}
