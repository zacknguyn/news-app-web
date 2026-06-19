package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedArticleDTO {
    private Long id;
    private ArticleDTO article;
    private LocalDateTime savedAt;
}
