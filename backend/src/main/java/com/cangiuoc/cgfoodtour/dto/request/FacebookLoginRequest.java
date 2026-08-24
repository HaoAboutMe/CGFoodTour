package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FacebookLoginRequest
{
    @NotBlank(message = "Facebook access token must not be blank")
    String accessToken;
}
