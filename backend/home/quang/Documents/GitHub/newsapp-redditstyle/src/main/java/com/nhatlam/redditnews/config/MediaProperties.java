package com.nhatlam.redditnews.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "media")
public class MediaProperties {
    private String storage = "local";
    private String localDir = "uploads/media";
    private String publicPath = "/media";
}
