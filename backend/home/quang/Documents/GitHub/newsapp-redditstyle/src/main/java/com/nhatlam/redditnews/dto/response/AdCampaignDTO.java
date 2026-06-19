package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdCampaignDTO {
    private Long id;
    private Long partnerId;
    private String partnerName;
    private String partnerEmail;
    private String brandName;
    private String headline;
    private String body;
    private String landingUrl;
    private String imageUrl;
    private String placement;
    private String targetAudience;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private String budgetNote;
    private String status;
    private String reviewNote;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
