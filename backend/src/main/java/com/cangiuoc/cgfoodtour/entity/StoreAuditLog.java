package com.cangiuoc.cgfoodtour.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "store_id", nullable = false)
    String storeId;

    @Column(name = "store_name", nullable = false)
    String storeName;

    @Column(name = "actor_id")
    String actorId;

    @Column(name = "actor_email", nullable = false)
    String actorEmail;

    @Column(name = "actor_role", nullable = false, length = 50)
    String actorRole;

    @Column(name = "action_type", nullable = false, length = 50)
    String actionType; // HIDE, RECOVER, HARD_DELETE

    @Column(name = "reason", columnDefinition = "TEXT")
    String reason;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
