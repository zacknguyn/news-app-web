package com.nhatlam.redditnews.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhatlam.redditnews.config.AiProperties;
import com.nhatlam.redditnews.dto.request.SummarizeArticleRequestDTO;
import com.nhatlam.redditnews.dto.response.SummarizeArticleResponseDTO;
import com.nhatlam.redditnews.exception.BadRequestException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSummarizationClient {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    public String summarize(SummarizeArticleRequestDTO request) {
        if (!aiProperties.isEnabled()) {
            throw new BadRequestException("AI summarization is disabled");
        }

        try {
            String requestBody = objectMapper.writeValueAsString(request);
            HttpRequest httpRequest = HttpRequest.newBuilder(summarizeUri())
                    .timeout(Duration.ofMillis(aiProperties.getTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(aiProperties.getTimeoutMs()))
                    .build();
            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("AI summarization request failed with status {}: {}", response.statusCode(), response.body());
                throw new BadRequestException("AI summarization request failed");
            }

            SummarizeArticleResponseDTO summarizeResponse = objectMapper.readValue(response.body(),
                    SummarizeArticleResponseDTO.class);
            if (summarizeResponse.getSummary() == null || summarizeResponse.getSummary().isBlank()) {
                throw new BadRequestException("AI summarization returned an empty summary");
            }
            return summarizeResponse.getSummary().trim();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("AI summarization request failed: {}", e.getMessage());
            throw new BadRequestException("AI summarization request failed");
        }
    }

    private URI summarizeUri() {
        String configuredBaseUrl = aiProperties.getSummarizeBaseUrl();
        String baseUrl = stripTrailingSlash(
                configuredBaseUrl != null && !configuredBaseUrl.isBlank() ? configuredBaseUrl : aiProperties.getBaseUrl());
        String path = aiProperties.getSummarizePath().startsWith("/")
                ? aiProperties.getSummarizePath()
                : "/" + aiProperties.getSummarizePath();
        return URI.create(baseUrl + path);
    }

    private String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:8000";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
