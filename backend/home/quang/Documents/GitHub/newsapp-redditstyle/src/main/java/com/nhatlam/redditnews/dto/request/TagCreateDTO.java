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
public class TagCreateDTO {
    @NotBlank(message = "Tên tag không được để trống")
    @Size(max = 100)
    private String name;

    /** Optional — auto-generated from name if blank */
    private String slug;
}
