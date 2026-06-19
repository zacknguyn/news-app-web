package com.nhatlam.redditnews.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhatlam.redditnews.exception.BadRequestException;

@Service
public class RecaptchaService {

    private static final String DEFAULT_ACTION = "credential_request";

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String secretKey;
    private final String verifyUrl;
    private final double minimumScore;

    public RecaptchaService(
            @Value("${app.security.recaptcha.enabled:false}") boolean enabled,
            @Value("${app.security.recaptcha.secret-key:}") String secretKey,
            @Value("${app.security.recaptcha.verify-url:https://www.google.com/recaptcha/api/siteverify}") String verifyUrl,
            @Value("${app.security.recaptcha.minimum-score:0.5}") double minimumScore) {
        this.enabled = enabled;
        this.secretKey = secretKey;
        this.verifyUrl = verifyUrl;
        this.minimumScore = minimumScore;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    public void verifyCredentialRequest(String token) {
        verify(token, DEFAULT_ACTION);
    }

    private void verify(String token, String expectedAction) {
        if (!enabled) {
            return;
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new BadRequestException("reCAPTCHA is not configured.");
        }
        if (token == null || token.isBlank()) {
            throw new BadRequestException("reCAPTCHA verification is required.");
        }

        RecaptchaVerifyResponse response = verifyWithGoogle(token);
        if (!response.success()) {
            throw new BadRequestException("reCAPTCHA verification failed.");
        }
        if (response.score() != null && response.score() < minimumScore) {
            throw new BadRequestException("reCAPTCHA score is too low.");
        }
        if (response.action() != null && !response.action().equals(expectedAction)) {
            throw new BadRequestException("reCAPTCHA action mismatch.");
        }
    }

    private RecaptchaVerifyResponse verifyWithGoogle(String token) {
        String body = "secret=" + encode(secretKey) + "&response=" + encode(token);
        HttpRequest request = HttpRequest.newBuilder(URI.create(verifyUrl))
                .timeout(Duration.ofSeconds(5))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException("reCAPTCHA verification failed.");
            }
            return objectMapper.readValue(response.body(), RecaptchaVerifyResponse.class);
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new BadRequestException("reCAPTCHA verification failed.");
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record RecaptchaVerifyResponse(
            boolean success,
            Double score,
            String action,
            @JsonProperty("error-codes") List<String> errorCodes) {
    }
}
