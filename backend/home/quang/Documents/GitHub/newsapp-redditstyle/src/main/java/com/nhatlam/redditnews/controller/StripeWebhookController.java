package com.nhatlam.redditnews.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.nhatlam.redditnews.dto.response.ApiResponse;
import com.nhatlam.redditnews.service.StripeWebhookService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeWebhookService stripeWebhookService;

    @PostMapping("/api/v1/stripe/webhook")
    public ResponseEntity<ApiResponse<Void>> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        stripeWebhookService.handle(payload, signature);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Stripe webhook processed").build());
    }
}
