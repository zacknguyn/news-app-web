package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDTO {
    private Long id;
    private String title;
    private String subtitle;
    private String content;
    private String aiSummary;
    private String slug;
    private String imageUrl;
    private String status;

    private LocalDateTime publishedAt;
    private Integer readTime;
    private Long views;
    private long commentsCount;

    private Boolean isFeatured;
    private Boolean isEditorsPick;

    // Author info (from User entity)
    private Long userId;
    private String authorName;
    private String authorAvatar;

    // View stats
    private Integer viewsToday;
    private Integer viewsWeek;
    private Integer viewsMonth;

    // Relations
    private List<CategoryDTO> categories;
    private List<TagDTO> tags;
}
