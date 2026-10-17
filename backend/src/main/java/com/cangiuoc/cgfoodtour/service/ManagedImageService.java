package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ManagedImageService {
    private final CloudinaryService cloudinaryService;
    private final MediaCleanupQueueService cleanupQueueService;

    public ManagedImage upload(MultipartFile file, String folder, long maximumBytes) {
        validate(file, maximumBytes);
        try {
            Map result = cloudinaryService.uploadImage(file, folder);
            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            if (url == null || publicId == null) throw new AppException(ErrorCode.UPLOAD_FAILED);
            return new ManagedImage(url, publicId);
        } catch (IOException exception) {
            log.error("Cloudinary image upload failed", exception);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }
    }

    public void deleteBestEffort(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            cloudinaryService.deleteImage(publicId);
        } catch (Exception exception) {
            log.error("Cloudinary cleanup must be retried for public id {}", publicId, exception);
            try {
                cleanupQueueService.enqueue(publicId, exception);
            } catch (Exception queueException) {
                log.error("Could not persist media cleanup task for public id {}", publicId, queueException);
            }
        }
    }

    public void deleteAfterCommit(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteBestEffort(publicId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteBestEffort(publicId);
            }
        });
    }

    private void validate(MultipartFile file, long maximumBytes) {
        if (file == null || file.isEmpty()) throw new AppException(ErrorCode.INVALID_FILE);
        if (file.getSize() > maximumBytes) throw new AppException(ErrorCode.FILE_TOO_LARGE);
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("image/jpeg")
                || contentType.equals("image/png") || contentType.equals("image/gif"))) {
            throw new AppException(ErrorCode.UNSUPPORTED_MEDIA_TYPE);
        }
        try {
            if (ImageIO.read(file.getInputStream()) == null) {
                throw new AppException(ErrorCode.INVALID_FILE);
            }
        } catch (IOException exception) {
            throw new AppException(ErrorCode.INVALID_FILE);
        }
    }

    public record ManagedImage(String url, String publicId) {}
}
