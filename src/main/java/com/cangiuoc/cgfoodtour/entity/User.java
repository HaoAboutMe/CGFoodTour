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
    String username;
    String firstname;
    String lastname;
    String email;
    String password;
    LocalDate dateOfBirth;

    @Builder.Default
    Boolean enabled = false;  // Tài khoản chưa được kích hoạt mặc định

    @Builder.Default
    Boolean emailVerified = false;  // Email chưa được xác thực

    @ManyToMany
    Set<Role> roles;
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
