package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.MediaCleanupTask;
import com.cangiuoc.cgfoodtour.repository.MediaCleanupTaskRepository;
import com.cangiuoc.cgfoodtour.enums.MediaCleanupStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaCleanupQueueService {
    private static final int MAX_ATTEMPTS = 10;
    private static final Duration[] BACKOFF = {
            Duration.ofMinutes(5), Duration.ofMinutes(15), Duration.ofHours(1),
            Duration.ofHours(6), Duration.ofHours(24)
    };
    private final MediaCleanupTaskRepository repository;
    private final ImageStorageService imageStorageService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueue(String publicId, Exception cause) {
        if (publicId == null || publicId.isBlank() || repository.existsByPublicId(publicId)) return;
        try {
            repository.save(MediaCleanupTask.builder()
                    .publicId(publicId)
                    .status(MediaCleanupStatus.PENDING)
                    .nextAttemptAt(LocalDateTime.now())
                    .lastError(abbreviate(cause))
                    .build());
        } catch (DataIntegrityViolationException duplicate) {
            log.debug("Media cleanup task already exists for public id {}", publicId);
        }
    }

    @Scheduled(fixedDelayString = "${app.media-cleanup.retry-delay-ms:300000}")
    @Transactional
    public void retryPending() {
        LocalDateTime now = LocalDateTime.now();
        for (MediaCleanupTask task : repository
                .findTop100ByStatusAndNextAttemptAtLessThanEqualOrderByNextAttemptAtAsc(
                        MediaCleanupStatus.PENDING, now)) {
            try {
                imageStorageService.deleteImage(task.getPublicId());
                repository.delete(task);
            } catch (Exception exception) {
                int attempts = task.getAttempts() + 1;
                task.setAttempts(attempts);
                task.setLastAttemptAt(now);
                task.setLastError(abbreviate(exception));
                if (attempts >= MAX_ATTEMPTS) {
                    task.setStatus(MediaCleanupStatus.DEAD);
                    task.setNextAttemptAt(null);
                } else {
                    Duration delay = BACKOFF[Math.min(attempts - 1, BACKOFF.length - 1)];
                    task.setNextAttemptAt(now.plus(delay));
                }
                repository.save(task);
                log.warn("Media cleanup retry failed (attempt {}, status {})", attempts, task.getStatus());
            }
        }
    }

    @Transactional
    public void retryDeadTask(long taskId) {
        MediaCleanupTask task = repository.findById(taskId).orElseThrow();
        task.setStatus(MediaCleanupStatus.PENDING);
        task.setAttempts(0);
        task.setNextAttemptAt(LocalDateTime.now());
        task.setLastError(null);
        repository.save(task);
    }

    private String abbreviate(Exception exception) {
        String message = exception == null ? "Unknown cleanup failure" : exception.getMessage();
        if (message == null || message.isBlank()) message = exception.getClass().getSimpleName();
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }
}
