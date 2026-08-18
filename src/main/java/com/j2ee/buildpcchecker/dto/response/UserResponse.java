package com.j2ee.buildpcchecker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UserResponse
{
    String id;
    String username;
    String firstname;
    String lastname;
    String email;
    LocalDate dateOfBirth;
    Boolean enabled;
    Boolean emailVerified;
    Set<RoleResponse> roles;
}
