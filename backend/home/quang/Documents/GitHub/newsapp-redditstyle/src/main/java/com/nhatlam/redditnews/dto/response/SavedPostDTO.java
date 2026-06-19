package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedPostDTO {
    private Long id;
    private PostDTO post;
    private LocalDateTime savedAt;
}
