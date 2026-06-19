package com.nhatlam.redditnews.dto.request;

import java.util.List;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleUpdateDTO {
    private String title;
    private String subtitle;
    private String content;
    private String aiSummary;
    private String imageUrl;
    private Integer readTime;
    private String status;

    private Long userId; // change author (admin/user)

    private List<Long> categoryIds;
    private List<Long> tagIds;

    private Boolean isFeatured;
    private Boolean isEditorsPick;
}
