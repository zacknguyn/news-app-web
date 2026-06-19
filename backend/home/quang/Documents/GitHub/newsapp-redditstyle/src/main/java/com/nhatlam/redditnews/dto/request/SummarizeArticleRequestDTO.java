package com.nhatlam.redditnews.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummarizeArticleRequestDTO {
    private String text;

    @JsonProperty("max_bullets")
    private Integer maxBullets;

    @JsonProperty("max_points")
    private Integer maxPoints;

    private String language;

    @JsonProperty("max_new_tokens")
    private Integer maxNewTokens;

    private Double temperature;

    @JsonProperty("top_p")
    private Double topP;
}
