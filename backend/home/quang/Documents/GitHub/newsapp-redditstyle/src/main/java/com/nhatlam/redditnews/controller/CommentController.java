package com.nhatlam.redditnews.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.CommentCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.CommentDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.CommentService;
import com.nhatlam.redditnews.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
@RequiresActiveAccount
@Tag(name = "Comments", description = "Quản lý bình luận (Hỗ trợ cấu trúc dạng cây lồng nhau)")
public class CommentController {

    private final CommentService commentService;
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

    @GetMapping("/article/{articleId}")
    @Operation(summary = "Lấy cây bình luận của bài viết", description = "Trả về danh sách các bình luận gốc (parent_id = null) của bài viết, mỗi bình luận gốc chứa đệ quy danh sách phản hồi của nó.")
    public ResponseEntity<ApiResponse<PaginatedResponse<CommentDTO>>> getCommentsByArticleId(
            @PathVariable Long articleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<CommentDTO> result = commentService.getCommentsByArticleIdPaged(
                articleId, page, size, getOptionalCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<CommentDTO>>builder().success(true).data(result).build());
    }

    @GetMapping("/post/{postId}")
    @Operation(summary = "Lấy cây bình luận của post", description = "Trả về danh sách bình luận gốc của một post thảo luận.")
    public ResponseEntity<ApiResponse<PaginatedResponse<CommentDTO>>> getCommentsByPostId(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<CommentDTO> result = commentService.getCommentsByPostIdPaged(
                postId, page, size, getOptionalCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<PaginatedResponse<CommentDTO>>builder().success(true).data(result).build());
    }

    @PostMapping("/article/{articleId}")
    @Operation(summary = "Đăng bình luận hoặc phản hồi bình luận khác", description = "Tạo bình luận mới cho bài viết. Nếu truyền lên parentId, bình luận sẽ được coi là phản hồi cho bình luận đó.")
    public ResponseEntity<ApiResponse<CommentDTO>> createComment(@PathVariable Long articleId,
            @RequestBody @Valid CommentCreateDTO createDTO) {
        Long userId = getCurrentUserId();
        CommentDTO newComment = commentService.createComment(articleId, userId, createDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CommentDTO>builder().success(true).data(newComment).build());
    }

    @PostMapping("/post/{postId}")
    @Operation(summary = "Đăng bình luận hoặc phản hồi cho post", description = "Tạo bình luận mới cho một post. Nếu truyền parentId, bình luận sẽ là phản hồi.")
    public ResponseEntity<ApiResponse<CommentDTO>> createPostComment(@PathVariable Long postId,
            @RequestBody @Valid CommentCreateDTO createDTO) {
        Long userId = getCurrentUserId();
        CommentDTO newComment = commentService.createPostComment(postId, userId, createDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CommentDTO>builder().success(true).data(newComment).build());
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Thích bình luận", description = "Thích bình luận một lần cho mỗi người dùng.")
    public ResponseEntity<ApiResponse<CommentDTO>> likeComment(@PathVariable Long id) {
        CommentDTO comment = commentService.likeComment(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<CommentDTO>builder().success(true).message("Liked comment").data(comment).build());
    }

    @DeleteMapping("/{id}/like")
    @Operation(summary = "Bỏ thích bình luận", description = "Hủy lượt thích bình luận của người dùng hiện tại.")
    public ResponseEntity<ApiResponse<CommentDTO>> unlikeComment(@PathVariable Long id) {
        CommentDTO comment = commentService.unlikeComment(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<CommentDTO>builder().success(true).message("Unliked comment").data(comment).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bình luận", description = "Xóa bình luận theo ID. Yêu cầu người thực hiện phải là chủ nhân của bình luận.")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id, getCurrentUserId());
        return ResponseEntity
                .ok(ApiResponse.<Void>builder().success(true).message("Deleted comment successfully").build());
    }
}
