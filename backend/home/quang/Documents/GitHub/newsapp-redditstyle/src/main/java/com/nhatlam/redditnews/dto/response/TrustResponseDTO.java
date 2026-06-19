package com.nhatlam.redditnews.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrustResponseDTO {
    private int totalScore;
    private int maxScore;
    private List<TrustFactor> factors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrustFactor {
        private String label;
        private int score;
        private int max;
    }
}
