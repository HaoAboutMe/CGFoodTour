package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.MediaCleanupTask;
import com.cangiuoc.cgfoodtour.repository.MediaCleanupTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaCleanupQueueService {
    private final MediaCleanupTaskRepository repository;
    private final CloudinaryService cloudinaryService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueue(String publicId, Exception cause) {
        if (publicId == null || publicId.isBlank() || repository.existsByPublicId(publicId)) return;
        try {
            repository.save(MediaCleanupTask.builder()
                    .publicId(publicId)
                    .lastError(abbreviate(cause))
                    .build());
        } catch (DataIntegrityViolationException duplicate) {
            log.debug("Media cleanup task already exists for public id {}", publicId);
        }
    }

    @Scheduled(fixedDelayString = "${app.media-cleanup.retry-delay-ms:300000}")
    @Transactional
    public void retryPending() {
        for (MediaCleanupTask task : repository.findTop100ByOrderByCreatedAtAsc()) {
            try {
                cloudinaryService.deleteImage(task.getPublicId());
                repository.delete(task);
            } catch (Exception exception) {
                task.setAttempts(task.getAttempts() + 1);
                task.setLastAttemptAt(LocalDateTime.now());
                task.setLastError(abbreviate(exception));
                repository.save(task);
                log.warn("Media cleanup retry failed for public id {}", task.getPublicId());
            }
        }
    }

    private String abbreviate(Exception exception) {
        String message = exception == null ? "Unknown cleanup failure" : exception.getMessage();
        if (message == null || message.isBlank()) message = exception.getClass().getSimpleName();
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }
}
