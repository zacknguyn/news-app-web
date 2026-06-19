package com.nhatlam.redditnews.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VoteResponseDTO {
    private Long postId;
    private Integer score;
    private Integer userVote;
}
