package com.nhatlam.redditnews.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultDTO {
    private String entityType;
    private Long id;
    private String title;
    private String subtitle;
    private String url;
    private String status;
    private String createdAt;
}
