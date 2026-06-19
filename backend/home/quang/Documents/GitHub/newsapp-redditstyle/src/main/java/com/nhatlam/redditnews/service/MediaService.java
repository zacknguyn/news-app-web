package com.nhatlam.redditnews.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.nhatlam.redditnews.dto.response.MediaDTO;
import com.nhatlam.redditnews.entity.Media;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.MediaRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final MediaStorageService mediaStorageService;

    @Transactional
    public MediaDTO upload(Long userId, MultipartFile file, String altText) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        MediaStorageService.StoredMedia stored = mediaStorageService.store(file);

        Media media = Media.builder()
                .user(user)
                .storageProvider("local")
                .objectKey(stored.objectKey())
                .url(stored.url())
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
                .sizeBytes(file.getSize())
                .altText(altText == null || altText.isBlank() ? null : altText.trim())
                .build();

        return toDTO(mediaRepository.save(media));
    }

    @Transactional(readOnly = true)
    public List<MediaDTO> getMine(Long userId) {
        return mediaRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDTO).toList();
    }

    private MediaDTO toDTO(Media media) {
        return MediaDTO.builder()
                .id(media.getId())
                .url(media.getUrl())
                .objectKey(media.getObjectKey())
                .storageProvider(media.getStorageProvider())
                .originalFilename(media.getOriginalFilename())
                .contentType(media.getContentType())
                .sizeBytes(media.getSizeBytes())
                .altText(media.getAltText())
                .createdAt(media.getCreatedAt())
                .build();
    }
}
