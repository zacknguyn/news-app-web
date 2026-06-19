package com.nhatlam.redditnews.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateArticleDTO {
    private String id;
    private String title;
    private List<String> topics;
    private String author;

    @JsonProperty("author_score")
    private Integer authorScore;
}
