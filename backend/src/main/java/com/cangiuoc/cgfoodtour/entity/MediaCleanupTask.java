package com.cangiuoc.cgfoodtour.entity;

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

    @Column(length = 1000)
    private String lastError;

    private LocalDateTime createdAt;
    private LocalDateTime lastAttemptAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
