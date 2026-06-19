package com.nhatlam.redditnews.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhatlam.redditnews.config.AiProperties;
import com.nhatlam.redditnews.dto.request.RecommendationRequestDTO;
import com.nhatlam.redditnews.dto.response.RecommendationResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationClient {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    public List<String> recommend(RecommendationRequestDTO request) {
        if (!aiProperties.isEnabled()) {
            return Collections.emptyList();
        }

        try {
            String requestBody = objectMapper.writeValueAsString(request);
            HttpRequest httpRequest = HttpRequest.newBuilder(recommendUri())
                    .timeout(Duration.ofMillis(aiProperties.getTimeoutMs())).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody)).build();

            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(aiProperties.getTimeoutMs()))
                    .build();
            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("AI recommendation request failed with status {}: {}", response.statusCode(), response.body());
                return Collections.emptyList();
            }

            RecommendationResponseDTO recommendationResponse = objectMapper.readValue(response.body(),
                    RecommendationResponseDTO.class);
            return recommendationResponse.getRecommendedIds() != null
                    ? recommendationResponse.getRecommendedIds()
                    : Collections.emptyList();
        } catch (Exception e) {
            log.warn("AI recommendation request failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private URI recommendUri() {
        String baseUrl = stripTrailingSlash(aiProperties.getBaseUrl());
        String path = aiProperties.getRecommendPath().startsWith("/")
                ? aiProperties.getRecommendPath()
                : "/" + aiProperties.getRecommendPath();
        return URI.create(baseUrl + path);
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:8000";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
