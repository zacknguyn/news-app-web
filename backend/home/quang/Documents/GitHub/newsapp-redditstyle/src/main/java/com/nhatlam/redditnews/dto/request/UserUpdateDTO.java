package com.nhatlam.redditnews.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {
    private String name;
    private String email;
    private String avatar;
    private String role; // "USER" | "ADMIN"
    private String status; // "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED"
    private String password; // optional — only set if non-blank
}
