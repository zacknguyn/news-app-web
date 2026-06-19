package com.nhatlam.redditnews.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostDTO {

    private Long id;
    private String title;
    private String content;
    private String sourceUrl;
    private String imageUrl;
    private Integer score;
    private Integer commentCount;
    private Integer userVote;
    private Boolean savedByMe;
    private Long userId;
    private String authorName;
    private Long topicId;
    private String topicName;
    private Long articleId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
