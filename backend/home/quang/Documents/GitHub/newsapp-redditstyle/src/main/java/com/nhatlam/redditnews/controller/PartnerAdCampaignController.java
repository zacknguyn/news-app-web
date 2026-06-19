package com.nhatlam.redditnews.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nhatlam.redditnews.dto.request.AdCampaignRequestDTO;
import com.nhatlam.redditnews.dto.response.AdCampaignDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.AdCampaignService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/partner/ads")
@RequiredArgsConstructor
@RequiresActiveAccount
public class PartnerAdCampaignController {

    private final AdCampaignService adCampaignService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<AdCampaignDTO>>> listMine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ok(adCampaignService.listMine(currentEmail(), page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdCampaignDTO>> create(@RequestBody @Valid AdCampaignRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok(adCampaignService.create(currentEmail(), dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdCampaignDTO>> update(
            @PathVariable Long id,
            @RequestBody @Valid AdCampaignRequestDTO dto) {
        return ResponseEntity.ok(ok(adCampaignService.updateMine(currentEmail(), id, dto)));
    }

    @PatchMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<AdCampaignDTO>> submit(@PathVariable Long id) {
        return ResponseEntity.ok(ok(adCampaignService.submitMine(currentEmail(), id)));
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
}
