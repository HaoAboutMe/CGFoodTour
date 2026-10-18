package com.cangiuoc.cgfoodtour.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    String refreshToken;
    @Builder.Default
    String tokenType = "Bearer";
    long expiresIn;
    @JsonIgnore
    long refreshExpiresIn;
    boolean isAuthenticated;
}
