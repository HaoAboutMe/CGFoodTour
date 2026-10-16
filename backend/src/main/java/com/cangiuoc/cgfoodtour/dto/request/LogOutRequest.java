package com.cangiuoc.cgfoodtour.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LogOutRequest
{
    @NotBlank(message = "UNAUTHENTICATED")
    String accessToken;

    @NotBlank(message = "UNAUTHENTICATED")
    String refreshToken;
}
