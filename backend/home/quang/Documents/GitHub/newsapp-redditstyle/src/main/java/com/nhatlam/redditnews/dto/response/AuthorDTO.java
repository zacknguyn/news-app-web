package com.nhatlam.redditnews.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorDTO {
    private Long id;
    private String name;
    private String slug;
    private String bio;
    private String avatarUrl;
    private String email;
    private String facebookUrl;
    private String twitterUrl;
    private Long articleCount;
}
