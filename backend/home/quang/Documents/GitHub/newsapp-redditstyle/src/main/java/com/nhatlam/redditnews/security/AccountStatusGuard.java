package com.nhatlam.redditnews.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.entity.User.UserStatus;
import com.nhatlam.redditnews.exception.ForbiddenException;
import com.nhatlam.redditnews.exception.UnauthorizedException;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AccountStatusGuard {

    private final UserRepository userRepository;

    public User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new UnauthorizedException("Authentication required.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    public void requireActiveCurrentUser() {
        User user = requireCurrentUser();
        UserStatus status = user.getStatus() != null ? user.getStatus() : UserStatus.ACTIVE;
        if (status != UserStatus.ACTIVE) {
            throw new ForbiddenException(messageFor(status));
        }
    }

    private String messageFor(UserStatus status) {
        return switch (status) {
            case PENDING -> "Account is pending review. Interactive actions are disabled until approval.";
            case SUSPENDED -> "Account is suspended. Interactive actions are disabled.";
            case REJECTED -> "Account was rejected. Interactive actions are disabled.";
            case ACTIVE -> "Account is active.";
        };
    }
}
