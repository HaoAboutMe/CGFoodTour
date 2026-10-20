package com.cangiuoc.cgfoodtour.service;

import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Isolated image storage for the local Docker rehearsal. It deliberately avoids
 * outbound calls and must never be active outside the rehearsal profile.
 */
@Service
@Profile("rehearsal")
public class RehearsalImageStorageService implements ImageStorageService {
    private static final String REHEARSAL_IMAGE_URL =
            "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    private final boolean failDelete;

    public RehearsalImageStorageService(
            @Value("${app.rehearsal.image-storage.fail-delete:false}") boolean failDelete) {
        this.failDelete = failDelete;
    }

    @Override
    public Map<String, Object> uploadImage(MultipartFile file, String subFolder) throws IOException {
        String folder = subFolder == null || subFolder.isBlank() ? "images" : subFolder.trim();
        return Map.of(
                "secure_url", REHEARSAL_IMAGE_URL,
                "public_id", "rehearsal/" + folder + "/" + UUID.randomUUID()
        );
    }

    @Override
    public Map<String, Object> deleteImage(String publicId) throws IOException {
        if (failDelete) {
            throw new IOException("Simulated rehearsal image deletion failure");
        }
        return Map.of("result", "ok");
    }
}
