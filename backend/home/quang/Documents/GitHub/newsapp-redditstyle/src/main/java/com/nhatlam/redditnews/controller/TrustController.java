package com.nhatlam.redditnews.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.TrustResponseDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users/me/trust")
@RequiredArgsConstructor
@RequiresActiveAccount
public class TrustController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<TrustResponseDTO>> getTrust() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId = userService.getUserByEmail(email).getId();
        TrustResponseDTO trust = userService.getTrust(userId);
        return ResponseEntity.ok(ApiResponse.success(trust));
    }
}
