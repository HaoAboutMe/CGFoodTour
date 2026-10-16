package com.cangiuoc.cgfoodtour.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_otp")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String email;

    @Column(name = "otp", nullable = false, length = 64)
    String otpHash;

    @Column(name = "expiry_date", nullable = false)
    LocalDateTime expiryDate;

    @Builder.Default
    @Column(name = "is_used", nullable = false)
    Boolean isUsed = false;

    @Builder.Default
    @Column(name = "failed_attempts", nullable = false)
    Integer failedAttempts = 0;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiryDate = LocalDateTime.now().plusMinutes(5); // OTP hết hạn sau 5 phút
        if (isUsed == null) isUsed = false;
        if (failedAttempts == null) failedAttempts = 0;
    }
}
