package com.nhatlam.redditnews.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripeCheckoutCreateDTO {
    private String plan;
    private String billingCadence;
}
