package com.nhatlam.redditnews.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.CredentialRequestCreateDTO;
import com.nhatlam.redditnews.dto.request.CredentialRequestReviewDTO;
import com.nhatlam.redditnews.dto.response.CredentialRequestDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.CredentialRequest;
import com.nhatlam.redditnews.entity.CredentialRequest.CredentialRequestStatus;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.CredentialRequestRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CredentialRequestService {

    private final CredentialRequestRepository credentialRequestRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecaptchaService recaptchaService;

    public CredentialRequestDTO create(CredentialRequestCreateDTO dto) {
        recaptchaService.verifyCredentialRequest(dto.getRecaptchaToken());

        if (userRepository.existsByEmail(dto.getEmail()) || credentialRequestRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email is already in use or awaiting review");
        }

        CredentialRequest request = CredentialRequest.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .reportingFocus(dto.getReportingFocus())
                .status(CredentialRequestStatus.PENDING)
                .build();

        return toDTO(credentialRequestRepository.save(request), null);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<CredentialRequestDTO> list(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<CredentialRequest> requests;

        if (status != null && !status.isBlank()) {
            try {
                requests = credentialRequestRepository.findByStatus(CredentialRequestStatus.valueOf(status.toUpperCase()), pageable);
            } catch (IllegalArgumentException error) {
                requests = Page.empty(pageable);
            }
        } else {
            requests = credentialRequestRepository.findAll(pageable);
        }

        return PaginatedResponse.of(requests.map(request -> toDTO(request, null)));
    }

    public CredentialRequestDTO approve(Long id) {
        CredentialRequest request = credentialRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credential request not found with id: " + id));

        if (request.getStatus() == CredentialRequestStatus.APPROVED) {
            throw new BadRequestException("Credential request is already approved");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A user with this email already exists");
        }

        request.setStatus(CredentialRequestStatus.APPROVED);
        request.setReviewedAt(LocalDateTime.now());

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(User.UserRole.USER);
        user.setStatus(User.UserStatus.ACTIVE);

        User savedUser = userRepository.save(user);
        return toDTO(credentialRequestRepository.save(request), savedUser);
    }

    public CredentialRequestDTO reject(Long id, CredentialRequestReviewDTO dto) {
        CredentialRequest request = credentialRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credential request not found with id: " + id));

        request.setStatus(CredentialRequestStatus.REJECTED);
        request.setRejectionReason(dto.getRejectionReason());
        request.setReviewedAt(LocalDateTime.now());

        return toDTO(credentialRequestRepository.save(request), null);
    }

    private CredentialRequestDTO toDTO(CredentialRequest request, User user) {
        return CredentialRequestDTO.builder()
                .id(request.getId())
                .name(request.getName())
                .email(request.getEmail())
                .reportingFocus(request.getReportingFocus())
                .status(request.getStatus().name())
                .rejectionReason(request.getRejectionReason())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .user(user != null ? toUserDTO(user) : null)
                .build();
    }

    private UserDTO toUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatar(user.getAvatar())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
