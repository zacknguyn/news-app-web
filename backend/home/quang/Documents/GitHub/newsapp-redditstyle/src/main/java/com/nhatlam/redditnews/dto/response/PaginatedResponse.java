package com.nhatlam.redditnews.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginatedResponse<T> {

    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private long totalPages;
    private boolean first;
    private boolean last;

    public static <T> PaginatedResponse<T> of(org.springframework.data.domain.Page<T> page) {
        return PaginatedResponse.<T>builder().content(page.getContent()).pageNumber(page.getNumber())
                .pageSize(page.getSize()).totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .first(page.isFirst()).last(page.isLast()).build();
    }
}
