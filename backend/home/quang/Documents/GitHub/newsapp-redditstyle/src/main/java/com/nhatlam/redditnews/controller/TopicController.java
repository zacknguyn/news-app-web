package com.nhatlam.redditnews.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.nhatlam.redditnews.dto.request.TopicCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.TopicDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.TopicService;
import com.nhatlam.redditnews.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@RequiresActiveAccount
@Tag(name = "Topics", description = "Quản lý chủ đề thảo luận (Subreddit)")
public class TopicController {

    private final TopicService topicService;
    private final UserService userService;

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByEmail(email).getId();
    }

    private Long getOptionalCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return userService.getUserByEmail(authentication.getName()).getId();
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả chủ đề", description = "Trả về toàn bộ danh sách các chủ đề thảo luận có trên hệ thống.")
    public ResponseEntity<ApiResponse<List<TopicDTO>>> getAllTopics() {
        return ResponseEntity.ok(ok(topicService.getAllTopics(getOptionalCurrentUserId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chủ đề theo ID", description = "Tìm và trả về chi tiết thông tin của chủ đề thông qua ID.")
    public ResponseEntity<ApiResponse<TopicDTO>> getTopicById(@PathVariable Long id) {
        return ResponseEntity.ok(ok(topicService.getTopicById(id, getOptionalCurrentUserId())));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Lấy thông tin chủ đề theo slug", description = "Tìm và trả về chi tiết thông tin của chủ đề thông qua slug.")
    public ResponseEntity<ApiResponse<TopicDTO>> getTopicBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ok(topicService.getTopicBySlug(slug, getOptionalCurrentUserId())));
    }

    @GetMapping("/mine")
    @Operation(summary = "Lấy danh sách community đã tham gia", description = "Trả về danh sách topic/community mà người dùng hiện tại đã tham gia.")
    public ResponseEntity<ApiResponse<List<TopicDTO>>> getMyTopics() {
        return ResponseEntity.ok(ok(topicService.getMyTopics(getCurrentUserId())));
    }

    @PostMapping
    @Operation(summary = "Tạo community mới", description = "Người dùng đã đăng nhập có thể tạo community/channel mới và tự động trở thành owner.")
    public ResponseEntity<ApiResponse<TopicDTO>> createTopic(@RequestBody @Valid TopicCreateDTO dto) {
        TopicDTO created = topicService.createTopic(dto, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<TopicDTO>builder()
                        .success(true)
                        .message("Tạo community thành công")
                        .data(created)
                        .build());
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Tham gia community", description = "Người dùng hiện tại tham gia một community/channel.")
    public ResponseEntity<ApiResponse<TopicDTO>> joinTopic(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<TopicDTO>builder()
                .success(true)
                .message("Joined community")
                .data(topicService.joinTopic(id, getCurrentUserId()))
                .build());
    }

    @DeleteMapping("/{id}/join")
    @Operation(summary = "Rời community", description = "Người dùng hiện tại rời một community/channel.")
    public ResponseEntity<ApiResponse<TopicDTO>> leaveTopic(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<TopicDTO>builder()
                .success(true)
                .message("Left community")
                .data(topicService.leaveTopic(id, getCurrentUserId()))
                .build());
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
}
