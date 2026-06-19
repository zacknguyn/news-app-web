package com.nhatlam.redditnews.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorCreateDTO {
    @NotBlank(message = "Tên tác giả không được để trống")
    @Size(max = 100)
    private String name;

    private String slug;
    private String bio;

    @Size(max = 500)
    private String avatarUrl;

    @Size(max = 100)
    private String email;

    @Size(max = 300)
    private String facebookUrl;

    @Size(max = 300)
    private String twitterUrl;
}
