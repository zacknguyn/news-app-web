package com.nhatlam.redditnews.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    @Builder.Default
    private boolean success = false;

    private String message;
    private List<String> error;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static ErrorResponse of(String message) {
        return ErrorResponse.builder().message(message).build();
    }

    public static ErrorResponse of(String message, List<String> errors) {
        return ErrorResponse.builder().message(message).error(errors).build();
    }
}
