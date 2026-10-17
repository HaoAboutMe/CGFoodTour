package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ChangePasswordRequest
{
    @NotBlank(message = "PASSWORD_INVALID")
    String oldPassword;

    @NotBlank(message = "PASSWORD_INVALID")
    @Size(min = 8, max = 72, message = "PASSWORD_INVALID")
    String newPassword;
}
