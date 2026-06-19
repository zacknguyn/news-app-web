package com.nhatlam.redditnews.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nhatlam.redditnews.dto.AuthResponse;
import com.nhatlam.redditnews.dto.request.CredentialRequestCreateDTO;
import com.nhatlam.redditnews.dto.request.UserLoginDTO;
import com.nhatlam.redditnews.dto.request.UserRegistration;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.CredentialRequestDTO;
import com.nhatlam.redditnews.service.AuthService;
import com.nhatlam.redditnews.service.CredentialRequestService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CredentialRequestService credentialRequestService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody UserLoginDTO loginDTO) {
        AuthResponse authResponse = authService.login(loginDTO);

        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder().success(true).message("Login successful")
                .data(authResponse).build());
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<CredentialRequestDTO>> registerUser(@Valid @RequestBody UserRegistration registerDTO) {
        CredentialRequestCreateDTO requestDTO = new CredentialRequestCreateDTO();
        requestDTO.setName(registerDTO.getName());
        requestDTO.setEmail(registerDTO.getEmail());
        requestDTO.setPassword(registerDTO.getPassword());
        requestDTO.setRecaptchaToken(registerDTO.getRecaptchaToken());
        CredentialRequestDTO credentialRequest = credentialRequestService.create(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CredentialRequestDTO>builder().success(true)
                .message("Credential request submitted").data(credentialRequest).build());
    }
}
