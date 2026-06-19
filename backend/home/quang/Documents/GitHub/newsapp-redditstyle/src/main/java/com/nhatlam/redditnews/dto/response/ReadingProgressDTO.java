package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReadingProgressDTO {
    private Long id;
    private Long postId;
    private String title;
    private Long articleId;
    private String channelName;
    private Integer progress;
    private Integer scrollY;
    private LocalDateTime updatedAt;
}
