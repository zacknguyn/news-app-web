package com.nhatlam.redditnews.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummarizeArticleResponseDTO {
    private String summary;
    private String model;

    @JsonProperty("input_chars")
    private Integer inputChars;
}
