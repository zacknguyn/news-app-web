package com.nhatlam.redditnews.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {
    private boolean enabled = false;
    private String baseUrl = "http://localhost:8000";
    private String recommendPath = "/recommend-reddit";
    private String summarizeBaseUrl = "";
    private String summarizePath = "/summarize";
    private int summaryMaxBullets = 6;
    private int summaryMaxNewTokens = 512;
    private double summaryTemperature = 0.2;
    private double summaryTopP = 0.8;
    private int timeoutMs = 10000;
    private int candidateLimit = 50;
}
