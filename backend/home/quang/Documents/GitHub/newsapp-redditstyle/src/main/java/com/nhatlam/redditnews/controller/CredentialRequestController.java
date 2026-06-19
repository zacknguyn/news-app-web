package com.nhatlam.redditnews.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.CredentialRequestCreateDTO;
import com.nhatlam.redditnews.dto.request.CredentialRequestReviewDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.CredentialRequestDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.CredentialRequestService;

@RestController
@RequiredArgsConstructor
public class CredentialRequestController {

    private final CredentialRequestService credentialRequestService;

    @PostMapping("/api/v1/credential-requests")
    public ResponseEntity<ApiResponse<CredentialRequestDTO>> create(@Valid @RequestBody CredentialRequestCreateDTO dto) {
        CredentialRequestDTO created = credentialRequestService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CredentialRequestDTO>builder()
                .success(true)
                .message("Credential request submitted")
                .data(created)
                .build());
    }

    @GetMapping("/api/v1/admin/credential-requests")
    public ResponseEntity<ApiResponse<PaginatedResponse<CredentialRequestDTO>>> list(
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<CredentialRequestDTO>>builder()
                .success(true)
                .data(credentialRequestService.list(status, page, size))
                .build());
    }

    @PostMapping("/api/v1/admin/credential-requests/{id}/approve")
    @RequiresActiveAccount
    public ResponseEntity<ApiResponse<CredentialRequestDTO>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<CredentialRequestDTO>builder()
                .success(true)
                .message("Credential request approved")
                .data(credentialRequestService.approve(id))
                .build());
    }

    @PostMapping("/api/v1/admin/credential-requests/{id}/reject")
    @RequiresActiveAccount
    public ResponseEntity<ApiResponse<CredentialRequestDTO>> reject(
            @PathVariable Long id,
            @RequestBody CredentialRequestReviewDTO dto) {
        return ResponseEntity.ok(ApiResponse.<CredentialRequestDTO>builder()
                .success(true)
                .message("Credential request rejected")
                .data(credentialRequestService.reject(id, dto))
                .build());
    }
}
