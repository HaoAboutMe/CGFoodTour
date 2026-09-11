package com.cangiuoc.cgfoodtour.entity;

import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "stores")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Store {
    @Id
    @Column(length = 255)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    Category category;

    @Column(nullable = false, length = 200)
    String name;

    @Column(name = "phone_number", length = 20)
    String phoneNumber;

    @Column(name = "address_line", nullable = false)
    String addressLine;

    @Column(name = "landmark_note", nullable = false)
    String landmarkNote;

    @Column(name = "latitude")
    Double latitude;

    @Column(name = "longitude")
    Double longitude;

    @Column(name = "map_url", length = 1000)
    String mapUrl;

    @Column(name = "open_time", nullable = false)
    LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    LocalTime closeTime;

    @Column(name = "price_min")
    @Builder.Default
    Double priceMin = 0.0;

    @Column(name = "price_max")
    @Builder.Default
    Double priceMax = 0.0;

    @Column(name = "banner_image_url")
    String bannerImageUrl;

    @Column(name = "is_verified")
    @Builder.Default
    Boolean isVerified = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    User owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    StoreStatus status = StoreStatus.PENDING;

    @Column(name = "rejection_reason")
    String rejectionReason;

    @Column(name = "hidden_by_admin")
    @Builder.Default
    Boolean hiddenByAdmin = false;

    @Column(name = "recovery_requested")
    @Builder.Default
    Boolean recoveryRequested = false;

    @Column(name = "recovery_request_reason", columnDefinition = "TEXT")
    String recoveryRequestReason;

    @Column(name = "recovery_decline_reason", columnDefinition = "TEXT")
    String recoveryDeclineReason;

    @Column(name = "hide_reason", columnDefinition = "TEXT")
    String hideReason;

    // Denormalized counters
    @Column(name = "count_very_satisfied")
    @Builder.Default
    Integer countVerySatisfied = 0;

    @Column(name = "count_normal")
    @Builder.Default
    Integer countNormal = 0;

    @Column(name = "count_not_satisfied")
    @Builder.Default
    Integer countNotSatisfied = 0;

    @Column(name = "total_votes")
    @Builder.Default
    Integer totalVotes = 0;

    @Column(name = "satisfaction_rate")
    @Builder.Default
    Double satisfactionRate = 0.00;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
