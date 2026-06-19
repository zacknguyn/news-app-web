package com.nhatlam.redditnews.config;

import java.nio.file.Path;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(MediaProperties.class)
public class MediaWebConfig implements WebMvcConfigurer {

    private final MediaProperties mediaProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Path.of(mediaProperties.getLocalDir()).toAbsolutePath().normalize();
        registry.addResourceHandler(mediaProperties.getPublicPath() + "/**")
                .addResourceLocations(uploadPath.toUri().toString());
    }
}
