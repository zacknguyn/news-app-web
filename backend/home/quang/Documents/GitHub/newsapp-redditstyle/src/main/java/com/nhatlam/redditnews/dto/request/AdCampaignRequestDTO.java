package com.nhatlam.redditnews.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdCampaignRequestDTO {

    @NotBlank(message = "Brand name is required")
    @Size(max = 160, message = "Brand name must not exceed 160 characters")
    private String brandName;

    @NotBlank(message = "Headline is required")
    @Size(max = 240, message = "Headline must not exceed 240 characters")
    private String headline;

    @NotBlank(message = "Body is required")
    @Size(max = 1000, message = "Body must not exceed 1000 characters")
    private String body;

    @NotBlank(message = "Landing URL is required")
    @Size(max = 500, message = "Landing URL must not exceed 500 characters")
    private String landingUrl;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @Size(max = 80, message = "Placement must not exceed 80 characters")
    private String placement;

    @Size(max = 240, message = "Target audience must not exceed 240 characters")
    private String targetAudience;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    @Size(max = 240, message = "Budget note must not exceed 240 characters")
    private String budgetNote;
}
