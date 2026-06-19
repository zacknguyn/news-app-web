package com.nhatlam.redditnews.dto;

import com.nhatlam.redditnews.dto.response.UserDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private UserDTO user;

    public AuthResponse(UserDTO user, String token) {
        this.user = user;
        this.token = token;
    }
}
