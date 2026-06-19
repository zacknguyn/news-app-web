package com.nhatlam.redditnews.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.MediaDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.MediaService;
import com.nhatlam.redditnews.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@RequiresActiveAccount
public class MediaController {

    private final MediaService mediaService;
    private final UserService userService;

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByEmail(email).getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MediaDTO>>> getMine() {
        return ResponseEntity.ok(ApiResponse.<List<MediaDTO>>builder()
                .success(true)
                .data(mediaService.getMine(getCurrentUserId()))
                .build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaDTO>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "altText", required = false) String altText) {
        MediaDTO uploaded = mediaService.upload(getCurrentUserId(), file, altText);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<MediaDTO>builder()
                .success(true)
                .message("Media uploaded")
                .data(uploaded)
                .build());
    }
}
