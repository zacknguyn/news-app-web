package com.nhatlam.redditnews.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.nhatlam.redditnews.dto.request.PostCreateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.dto.response.PostDTO;
import com.nhatlam.redditnews.dto.response.VoteResponseDTO;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.PostService;
import com.nhatlam.redditnews.service.UserService;
import com.nhatlam.redditnews.service.VoteService;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@RequiresActiveAccount
@Tag(name = "Posts", description = "Quản lý bài viết thảo luận và Vote (Reddit-style)")
public class PostController {

    private final PostService postService;
    private final VoteService voteService;
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

    @PostMapping
    @Operation(summary = "Đăng bài viết mới", description = "Tạo một bài thảo luận mới thuộc một Topic. Có thể gắn kèm theo bài báo (articleId) nếu muốn chia sẻ tin tức.")
    public ResponseEntity<ApiResponse<PostDTO>> createPost(@RequestBody @Valid PostCreateDTO dto) {
        Long userId = getCurrentUserId();
        PostDTO created = postService.createPost(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PostDTO>builder()
                        .success(true)
                        .message("Đăng bài viết thành công")
                        .data(created)
                        .build());
    }

    @GetMapping("/hot")
    @Operation(summary = "Lấy bảng tin bài viết HOT", description = "Trả về danh sách các bài viết xếp hạng theo thuật toán Reddit Hot (kết hợp điểm số và sự suy giảm theo thời gian), hỗ trợ phân trang.")
    public ResponseEntity<ApiResponse<PaginatedResponse<PostDTO>>> getHotFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<PostDTO> feed = postService.getHotFeed(page, size, getOptionalCurrentUserId());
        return ResponseEntity.ok(ok(feed));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết bài viết", description = "Trả về một bài viết cùng trạng thái vote của người xem nếu đã đăng nhập.")
    public ResponseEntity<ApiResponse<PostDTO>> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(ok(postService.getById(id, getOptionalCurrentUserId())));
    }

    @GetMapping("/topic/{topicId}")
    @Operation(summary = "Lấy danh sách bài viết theo chủ đề", description = "Lấy toàn bộ danh sách bài viết thuộc về một chủ đề (Topic) cụ thể, sắp xếp theo thời gian mới nhất.")
    public ResponseEntity<ApiResponse<PaginatedResponse<PostDTO>>> getPostsByTopic(
            @PathVariable Long topicId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<PostDTO> posts = postService.getPostsByTopic(topicId, page, size, getOptionalCurrentUserId());
        return ResponseEntity.ok(ok(posts));
    }

    @PostMapping("/{id}/vote")
    @Operation(summary = "Bình chọn bài viết (Upvote/Downvote)", description = "Thực hiện Upvote (type = 1) hoặc Downvote (type = -1) cho bài viết. Nhấn lại cùng loại sẽ hủy bỏ bình chọn.")
    public ResponseEntity<ApiResponse<VoteResponseDTO>> votePost(
            @PathVariable Long id,
            @RequestParam Integer type) { // type = 1 (Upvote) hoặc -1 (Downvote)
        Long userId = getCurrentUserId();
        VoteResponseDTO vote = voteService.votePost(id, userId, type);
        String voteMsg = type == 1 ? "Upvoted bài viết" : "Downvoted bài viết";
        return ResponseEntity.ok(ApiResponse.<VoteResponseDTO>builder()
                .success(true)
                .message(voteMsg)
                .data(vote)
                .build());
    }


    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa bài viết", description = "Chủ bài viết hoặc admin có thể xóa bài viết cùng dữ liệu phụ thuộc.")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        postService.deletePost(id, userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã xóa bài viết")
                .build());
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
}
