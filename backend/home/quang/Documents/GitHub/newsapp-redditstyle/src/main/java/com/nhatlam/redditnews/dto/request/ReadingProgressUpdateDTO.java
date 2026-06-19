package com.nhatlam.redditnews.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReadingProgressUpdateDTO {
    @NotNull
    private Long postId;

    private Long articleId;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer progress;

    @NotNull
    @Min(0)
    private Integer scrollY;
}
