package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CredentialRequestDTO {
    private Long id;
    private String name;
    private String email;
    private String reportingFocus;
    private String status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private UserDTO user;
}
