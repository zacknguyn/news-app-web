package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String avatar;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private String profileHeadline;
    private String profileBio;
    private String profileAccent;
    private List<String> profileTags;
    private List<String> unlockedBadges;
    private String selectedBadge;
    private String subscriptionPlan;
    private String billingCadence;
    private String subscriptionStatus;
    private List<String> entitlements;
}
