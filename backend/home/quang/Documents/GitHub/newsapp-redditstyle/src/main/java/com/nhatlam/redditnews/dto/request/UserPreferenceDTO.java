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
public class UserPreferenceDTO {
    @JsonProperty("top_upvoted_topics")
    private List<String> topUpvotedTopics;

    @JsonProperty("favorite_authors")
    private List<String> favoriteAuthors;
}
