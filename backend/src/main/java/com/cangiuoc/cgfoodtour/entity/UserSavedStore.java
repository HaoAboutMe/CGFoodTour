package com.cangiuoc.cgfoodtour.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_saved_stores", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "store_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSavedStore {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    Store store;

    @Column(name = "saved_at", updatable = false)
    LocalDateTime savedAt;

    @PrePersist
    protected void onCreate() {
        savedAt = LocalDateTime.now();
    }
}
