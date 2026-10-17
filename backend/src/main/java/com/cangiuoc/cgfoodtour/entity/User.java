package com.cangiuoc.cgfoodtour.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User
{
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true)
    String username;
    String firstname;
    String lastname;

    @Column(unique = true)
    String email;
    String password;
    LocalDate dateOfBirth;
    String avatarUrl;
    String avatarPublicId;

    @Column(unique = true)
    String googleId;

    @Column(unique = true)
    String facebookId;

    @Builder.Default
    @Column
    Long tokenVersion = 0L;

    @Builder.Default
    Boolean enabled = false;  // Tài khoản chưa được kích hoạt mặc định

    @Builder.Default
    Boolean emailVerified = false;  // Email chưa được xác thực

    @Column(length = 1000)
    String disabledReason;
    LocalDateTime disabledAt;
    String disabledByAdminId;

    @ManyToMany
    Set<Role> roles;
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
