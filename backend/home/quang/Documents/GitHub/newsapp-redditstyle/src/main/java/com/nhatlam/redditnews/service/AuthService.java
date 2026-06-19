package com.nhatlam.redditnews.service;

import jakarta.transaction.Transactional;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nhatlam.redditnews.dto.AuthResponse;
import com.nhatlam.redditnews.dto.request.UserLoginDTO;
import com.nhatlam.redditnews.dto.request.UserRegistration;
import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse login(UserLoginDTO loginDTO) {
        Authentication authentication = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        User user = userRepository.findByEmail(loginDTO.getEmail()).orElseThrow();
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new DisabledException("Account is not active");
        }
        return AuthResponse.builder().token(jwt).user(UserDTO.builder().id(user.getId()).name(user.getName())
                .email(user.getEmail()).role(user.getRole().name()).status(user.getStatus().name()).build()).build();
    }

    @Transactional
    public AuthResponse register(UserRegistration registerDTO) {
        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }

        User user = new User();
        user.setName(registerDTO.getName());
        user.setEmail(registerDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setRole(User.UserRole.USER);
        user.setStatus(User.UserStatus.PENDING);
        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerDTO.getEmail(), registerDTO.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return AuthResponse.builder().token(jwt).user(UserDTO.builder().id(savedUser.getId()).name(savedUser.getName())
                .email(savedUser.getEmail()).role(savedUser.getRole().name()).build()).build();
    }
}
