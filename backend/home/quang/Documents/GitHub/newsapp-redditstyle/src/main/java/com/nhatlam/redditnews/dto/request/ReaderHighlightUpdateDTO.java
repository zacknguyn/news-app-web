package com.nhatlam.redditnews.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReaderHighlightUpdateDTO {
    @Size(max = 4000)
    private String note;
}
