package com.nhatlam.redditnews.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.nhatlam.redditnews.config.MediaProperties;
import com.nhatlam.redditnews.exception.BadRequestException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LocalMediaStorageService implements MediaStorageService {

    private final MediaProperties mediaProperties;

    @Override
    public StoredMedia store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Media file is required");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.startsWith("image/")) {
            throw new BadRequestException("Only image uploads are supported");
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String objectKey = UUID.randomUUID() + extension;
        Path root = Path.of(mediaProperties.getLocalDir()).toAbsolutePath().normalize();
        Path target = root.resolve(objectKey).normalize();

        try {
            Files.createDirectories(root);
            file.transferTo(target);
        } catch (IOException error) {
            throw new BadRequestException("Could not store media file");
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(mediaProperties.getPublicPath())
                .path("/")
                .path(objectKey)
                .toUriString();

        return new StoredMedia(objectKey, url);
    }

    private String getExtension(String originalFilename, String contentType) {
        String filename = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename);
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            return filename.substring(dot).toLowerCase(Locale.ROOT);
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
