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

public class TopicDTO {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String avatar;
    private String banner;
    private String rules;
    private Long ownerId;
    private String ownerName;
    private long memberCount;
    private long postCount;
    private boolean joined;
    private LocalDateTime createdAt;
}
