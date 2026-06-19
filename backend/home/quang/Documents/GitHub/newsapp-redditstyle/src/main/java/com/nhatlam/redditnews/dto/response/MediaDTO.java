package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MediaDTO {
    private Long id;
    private String url;
    private String objectKey;
    private String storageProvider;
    private String originalFilename;
    private String contentType;
    private Long sizeBytes;
    private String altText;
    private LocalDateTime createdAt;
}
