package com.nhatlam.redditnews.dto.request;

import java.util.List;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleCreateDTO {
    private String title;
    private String subtitle;
    private String content;
    private String aiSummary;
    private String imageUrl;
    private Integer readTime;
    private String slug; // optional – auto-generated if blank
    private String status; // "PUBLISHED" | "DRAFT"

    private Long userId; // link to users table (author = admin/user)

    private List<Long> categoryIds;
    private List<Long> tagIds;

    private Boolean isFeatured;
    private Boolean isEditorsPick;
}
