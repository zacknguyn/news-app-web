package com.nhatlam.redditnews.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class PostCreateDTO {

    @NotBlank(message = "Post title is required")
    @Size(max = 255, message = "Post title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Post content is required")
    private String content;

    private String sourceUrl;

    private String imageUrl;

    @NotNull(message = "Topic ID is required")
    private Long topicId;

    private Long articleId; //link toi bai bao neu day la bai chia se tin tuc
}
