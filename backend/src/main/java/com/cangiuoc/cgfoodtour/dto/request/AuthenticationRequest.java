package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationRequest
{
    @NotBlank(message = "EMAIL_INVALID")
    @Email(message = "EMAIL_INVALID")
    String email;

    @NotBlank(message = "PASSWORD_INVALID")
    String password;
}
