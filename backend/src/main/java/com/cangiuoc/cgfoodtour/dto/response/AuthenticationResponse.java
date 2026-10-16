package com.cangiuoc.cgfoodtour.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationResponse
{
    String accessToken;
    String refreshToken;
    @Builder.Default
    String tokenType = "Bearer";
    long expiresIn;
    long refreshExpiresIn;
    boolean isAuthenticated;
}
