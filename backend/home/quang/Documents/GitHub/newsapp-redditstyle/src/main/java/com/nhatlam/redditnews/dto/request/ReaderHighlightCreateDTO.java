package com.nhatlam.redditnews.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReaderHighlightCreateDTO {
    private Long postId;
    private Long articleId;

    @NotBlank
    @Size(max = 2000)
    private String text;

    private Integer startOffset;
    private Integer endOffset;

    @Size(max = 4000)
    private String note;
}
