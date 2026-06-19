package com.nhatlam.redditnews.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nhatlam.redditnews.dto.request.AdCampaignReviewDTO;
import com.nhatlam.redditnews.dto.response.AdCampaignDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.AdCampaignService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/ads")
@RequiredArgsConstructor
@RequiresActiveAccount
public class AdminAdCampaignController {

    private final AdCampaignService adCampaignService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<AdCampaignDTO>>> list(
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ok(adCampaignService.listForAdmin(status, page, size)));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AdCampaignDTO>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid AdCampaignReviewDTO dto) {
        return ResponseEntity.ok(ok(adCampaignService.approve(id, currentEmail(), dto)));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<AdCampaignDTO>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid AdCampaignReviewDTO dto) {
        return ResponseEntity.ok(ok(adCampaignService.reject(id, currentEmail(), dto)));
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
}
