package com.nhatlam.redditnews.service;

import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {
    StoredMedia store(MultipartFile file);

    record StoredMedia(String objectKey, String url) {
    }
}
