package com.nhatlam.redditnews.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewStatsDTO {
    /** Total all-time views */
    private Long total;

    /** Views in the last 24 hours */
    private Long today;

    /** Views in the last 7 days */
    private Long thisWeek;

    /** Views in the last 30 days */
    private Long thisMonth;
}
