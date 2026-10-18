package com.cangiuoc.cgfoodtour.entity;

import com.cangiuoc.cgfoodtour.enums.MediaCleanupStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_cleanup_tasks", uniqueConstraints =
        @UniqueConstraint(name = "uk_media_cleanup_public_id", columnNames = "public_id"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaCleanupTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, length = 500)
    private String publicId;

    @Builder.Default
    private int attempts = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MediaCleanupStatus status = MediaCleanupStatus.PENDING;

    @Column(length = 1000)
    private String lastError;

    private LocalDateTime createdAt;
    private LocalDateTime lastAttemptAt;
    private LocalDateTime nextAttemptAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (nextAttemptAt == null) nextAttemptAt = createdAt;
        if (status == null) status = MediaCleanupStatus.PENDING;
    }
}
