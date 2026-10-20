package com.cangiuoc.cgfoodtour.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface ImageStorageService {
    Map<String, Object> uploadImage(MultipartFile file, String subFolder) throws IOException;

    Map<String, Object> deleteImage(String publicId) throws IOException;
}
