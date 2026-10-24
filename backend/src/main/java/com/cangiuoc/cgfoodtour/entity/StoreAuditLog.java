package com.cangiuoc.cgfoodtour.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_audit_logs", indexes = {
        @Index(name = "idx_store_audit_owner_created", columnList = "owner_id_snapshot,created_at,id"),
        @Index(name = "idx_store_audit_store_created", columnList = "store_id,created_at,id")
})
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

    @Column(name = "owner_id_snapshot")
    String ownerIdSnapshot;

    @Column(name = "actor_id")
    String actorId;

    @Column(name = "actor_email")
    String actorEmail;

    @Column(name = "actor_role", nullable = false, length = 50)
    String actorRole;

    @Column(name = "action_type", nullable = false, length = 50)
    String actionType; // HIDE, RECOVER, HARD_DELETE

    @Column(name = "reason", columnDefinition = "TEXT")
    String reason;

    @Column(name = "status_before", length = 50)
    String statusBefore;

    @Column(name = "status_after", length = 50)
    String statusAfter;

    @Column(name = "owner_visible", nullable = false)
    @Builder.Default
    Boolean ownerVisible = false;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
