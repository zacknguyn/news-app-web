package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReaderHighlightDTO {
    private Long id;
    private Long postId;
    private String postTitle;
    private Long articleId;
    private String articleTitle;
    private String channelName;
    private String text;
    private Integer startOffset;
    private Integer endOffset;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
