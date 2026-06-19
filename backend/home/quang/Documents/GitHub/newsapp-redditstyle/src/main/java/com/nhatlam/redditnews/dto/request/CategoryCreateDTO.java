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
public class CategoryCreateDTO {
    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100)
    private String name;

    /** Optional — auto-generated from name if blank */
    private String slug;

    @Size(max = 500)
    private String description;
}
