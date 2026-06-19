package com.nhatlam.redditnews.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdCampaignReviewDTO {

    @Size(max = 1000, message = "Review note must not exceed 1000 characters")
    private String reviewNote;
}
