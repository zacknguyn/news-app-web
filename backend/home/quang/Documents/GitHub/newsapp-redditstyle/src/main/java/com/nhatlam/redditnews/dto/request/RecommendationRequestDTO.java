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
public class RecommendationRequestDTO {
    @JsonProperty("user_preference")
    private UserPreferenceDTO userPreference;

    @JsonProperty("candidate_articles")
    private List<CandidateArticleDTO> candidateArticles;

    @JsonProperty("num_recommendations")
    private Integer numRecommendations;
}
