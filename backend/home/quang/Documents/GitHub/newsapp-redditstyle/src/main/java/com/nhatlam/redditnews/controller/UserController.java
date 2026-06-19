package com.nhatlam.redditnews.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.ProfileCustomizationUpdateDTO;
import com.nhatlam.redditnews.dto.request.StripeCheckoutCreateDTO;
import com.nhatlam.redditnews.dto.request.SubscriptionUpdateDTO;
import com.nhatlam.redditnews.dto.request.UserUpdateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.SavedArticleDTO;
import com.nhatlam.redditnews.dto.response.SavedPostDTO;
import com.nhatlam.redditnews.dto.response.StripeCheckoutSessionDTO;
import com.nhatlam.redditnews.dto.response.StripePortalSessionDTO;
import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.security.RequiresActiveAccount;
import com.nhatlam.redditnews.service.SavedArticleService;
import com.nhatlam.redditnews.service.SavedPostService;
import com.nhatlam.redditnews.service.StripeCheckoutService;
import com.nhatlam.redditnews.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@RequiresActiveAccount
public class UserController {

    private final UserService userService;
    private final SavedArticleService savedArticleService;
    private final SavedPostService savedPostService;
    private final StripeCheckoutService stripeCheckoutService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    @PostMapping("/me/subscription/portal")
    public ResponseEntity<ApiResponse<StripePortalSessionDTO>> createSubscriptionPortal() {
        StripePortalSessionDTO session = stripeCheckoutService.createPortalSession(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<StripePortalSessionDTO>builder().success(true)
                .message("Stripe Portal session created").data(session).build());
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByEmail(email).getId();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        UserDTO userDTO = userService.getUserById(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true).data(userDTO).build());
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserProfile(@PathVariable Long id) {
        UserDTO userDTO = userService.getUserById(id);
        userDTO.setEmail(null);
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true).data(userDTO).build());
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateCurrentUser(@RequestBody UserUpdateDTO dto) {
        Long id = getCurrentUserId();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (dto.getName() != null && !dto.getName().isBlank())
            user.setName(dto.getName());
        if (dto.getAvatar() != null)
            user.setAvatar(dto.getAvatar());
        if (dto.getPassword() != null && !dto.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(dto.getPassword()));

        User saved = userRepository.save(user);
        UserDTO result = UserDTO.builder()
                .id(saved.getId()).name(saved.getName()).email(saved.getEmail())
                .avatar(saved.getAvatar()).role(saved.getRole() != null ? saved.getRole().name() : "USER")
                .status(saved.getStatus() != null ? saved.getStatus().name() : "ACTIVE")
                .createdAt(saved.getCreatedAt()).build();
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true).data(result).build());
    }

    @GetMapping("/me/subscription")
    public ResponseEntity<ApiResponse<UserDTO>> getMySubscription() {
        UserDTO userDTO = userService.getUserById(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true).data(userDTO).build());
    }

    @PutMapping("/me/subscription")
    public ResponseEntity<ApiResponse<UserDTO>> updateMySubscription(@RequestBody SubscriptionUpdateDTO dto) {
        UserDTO userDTO = userService.updateSubscription(getCurrentUserId(), dto);
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true)
                .message("Subscription updated").data(userDTO).build());
    }

    @PostMapping("/me/subscription/checkout")
    public ResponseEntity<ApiResponse<StripeCheckoutSessionDTO>> createSubscriptionCheckout(
            @RequestBody StripeCheckoutCreateDTO dto) {
        StripeCheckoutSessionDTO session = stripeCheckoutService.createSession(getCurrentUserId(), dto);
        return ResponseEntity.ok(ApiResponse.<StripeCheckoutSessionDTO>builder().success(true)
                .message("Stripe Checkout session created").data(session).build());
    }

    @PostMapping("/me/subscription/checkout/complete")
    public ResponseEntity<ApiResponse<UserDTO>> completeSubscriptionCheckout(@RequestParam String sessionId) {
        UserDTO userDTO = stripeCheckoutService.completeSession(getCurrentUserId(), sessionId);
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true)
                .message("Stripe subscription activated").data(userDTO).build());
    }

    @PutMapping("/me/profile-customization")
    public ResponseEntity<ApiResponse<UserDTO>> updateMyProfileCustomization(
            @RequestBody ProfileCustomizationUpdateDTO dto) {
        UserDTO userDTO = userService.updateProfileCustomization(getCurrentUserId(), dto);
        return ResponseEntity.ok(ApiResponse.<UserDTO>builder().success(true)
                .message("Profile customization updated").data(userDTO).build());
    }

    @GetMapping("/me/saved-articles")
    public ResponseEntity<ApiResponse<List<SavedArticleDTO>>> getMySavedArticles() {
        List<SavedArticleDTO> savedArticles = savedArticleService.getSavedArticlesByUserId(getCurrentUserId());
        return ResponseEntity
                .ok(ApiResponse.<List<SavedArticleDTO>>builder().success(true).data(savedArticles).build());
    }

    @PostMapping("/me/saved-articles/{articleId}")
    public ResponseEntity<ApiResponse<SavedArticleDTO>> saveArticle(@PathVariable Long articleId) {
        SavedArticleDTO saved = savedArticleService.saveArticle(getCurrentUserId(), articleId);
        return ResponseEntity.ok(ApiResponse.<SavedArticleDTO>builder().success(true)
                .message("Article saved to your list").data(saved).build());
    }

    @DeleteMapping("/me/saved-articles/{articleId}")
    public ResponseEntity<ApiResponse<Void>> unsaveArticle(@PathVariable Long articleId) {
        savedArticleService.unsaveArticle(getCurrentUserId(), articleId);
        return ResponseEntity
                .ok(ApiResponse.<Void>builder().success(true).message("Article removed from saved list").build());
    }

    @GetMapping("/me/saved-posts")
    public ResponseEntity<ApiResponse<List<SavedPostDTO>>> getMySavedPosts() {
        List<SavedPostDTO> savedPosts = savedPostService.getSavedPostsByUserId(getCurrentUserId());
        return ResponseEntity
                .ok(ApiResponse.<List<SavedPostDTO>>builder().success(true).data(savedPosts).build());
    }

    @PostMapping("/me/saved-posts/{postId}")
    public ResponseEntity<ApiResponse<SavedPostDTO>> savePost(@PathVariable Long postId) {
        SavedPostDTO saved = savedPostService.savePost(getCurrentUserId(), postId);
        return ResponseEntity.ok(ApiResponse.<SavedPostDTO>builder().success(true)
                .message("Post saved to your list").data(saved).build());
    }

    @DeleteMapping("/me/saved-posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> unsavePost(@PathVariable Long postId) {
        savedPostService.unsavePost(getCurrentUserId(), postId);
        return ResponseEntity
                .ok(ApiResponse.<Void>builder().success(true).message("Post removed from saved list").build());
    }
}
