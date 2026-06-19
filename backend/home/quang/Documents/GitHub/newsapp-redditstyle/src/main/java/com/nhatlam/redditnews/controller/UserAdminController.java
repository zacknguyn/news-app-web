package com.nhatlam.redditnews.controller;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.nhatlam.redditnews.dto.request.UserUpdateDTO;
import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.entity.User.UserRole;
import com.nhatlam.redditnews.entity.User.UserStatus;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.security.RequiresActiveAccount;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@RequiresActiveAccount
public class UserAdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<UserDTO>>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> result;

        if (status != null && !status.isBlank()) {
            try {
                UserStatus userStatus = UserStatus.valueOf(status.toUpperCase());
                result = userRepository.findByStatus(userStatus, pageable);
            } catch (IllegalArgumentException e) {
                result = Page.empty(pageable);
            }
        } else if (role != null && !role.isBlank()) {
            try {
                UserRole userRole = UserRole.valueOf(role.toUpperCase());
                result = userRepository.findByRole(userRole, pageable);
            } catch (IllegalArgumentException e) {
                result = Page.empty(pageable);
            }
        } else if (!search.isBlank()) {
            result = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pageable);
        } else {
            result = userRepository.findAll(pageable);
        }

        PaginatedResponse<UserDTO> response = PaginatedResponse.<UserDTO>builder()
                .content(result.getContent().stream().map(this::toDTO).toList())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getById(@PathVariable Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id: " + id));
        return ResponseEntity.ok(ok(toDTO(u)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> update(@PathVariable Long id, @RequestBody UserUpdateDTO dto) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            u.setName(dto.getName());
        if (dto.getEmail() != null && !dto.getEmail().isBlank())
            u.setEmail(dto.getEmail());
        if (dto.getAvatar() != null)
            u.setAvatar(dto.getAvatar());
        if (dto.getPassword() != null && !dto.getPassword().isBlank())
            u.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (dto.getRole() != null) {
            try {
                u.setRole(UserRole.valueOf(dto.getRole().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
            }
        }

        return ResponseEntity.ok(ok(toDTO(userRepository.save(u))));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserDTO>> updateStatus(@PathVariable Long id, @RequestBody UserUpdateDTO dto) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id: " + id));

        if (dto.getStatus() != null) {
            try {
                u.setStatus(UserStatus.valueOf(dto.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
            }
        }

        return ResponseEntity.ok(ok(toDTO(userRepository.save(u))));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserDTO>> updateRole(@PathVariable Long id, @RequestBody UserUpdateDTO dto) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id: " + id));

        if (dto.getRole() != null) {
            try {
                u.setRole(UserRole.valueOf(dto.getRole().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
            }
        }

        return ResponseEntity.ok(ok(toDTO(userRepository.save(u))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (!userRepository.existsById(id))
            throw new ResourceNotFoundException("Không tìm thấy người dùng id: " + id);
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Đã xóa người dùng").build());
    }

    private UserDTO toDTO(User u) {
        return UserDTO.builder().id(u.getId()).email(u.getEmail()).name(u.getName()).avatar(u.getAvatar())
                .role(u.getRole() != null ? u.getRole().name() : "USER")
                .status(u.getStatus() != null ? u.getStatus().name() : "ACTIVE")
                .subscriptionPlan(u.getSubscriptionPlan() != null ? u.getSubscriptionPlan().name() : "FREE")
                .billingCadence(u.getBillingCadence() != null ? u.getBillingCadence().name() : "MONTHLY")
                .subscriptionStatus(u.getSubscriptionStatus() != null ? u.getSubscriptionStatus().name() : "ACTIVE")
                .createdAt(u.getCreatedAt()).build();
    }

    private <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
}
