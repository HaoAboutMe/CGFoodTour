package com.cangiuoc.cgfoodtour.configuration;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "security.auth-rate-limit")
public class AuthRateLimitProperties {
    @Min(1)
    private int loginEmailLimit = 10;

    @Min(1)
    private int loginIpLimit = 30;

    @NotNull
    private Duration loginWindow = Duration.ofMinutes(15);

    @Min(1)
    private int socialIpLimit = 20;

    @NotNull
    private Duration socialWindow = Duration.ofMinutes(5);

    @Min(1)
    private int maximumKeys = 10_000;

    @Min(1)
    private int registrationIpLimit = 5;

    @Min(1)
    private int registrationEmailLimit = 3;

    @NotNull
    private Duration registrationIpWindow = Duration.ofHours(1);

    @NotNull
    private Duration registrationEmailWindow = Duration.ofHours(24);

    @Min(1)
    private int pendingRegistrationLimit = 5;

    @NotNull
    private Duration pendingRegistrationRetention = Duration.ofDays(7);

    @Min(1)
    private int mapsUserLimit = 10;

    @Min(1)
    private int mapsIpLimit = 30;

    @NotNull
    private Duration mapsWindow = Duration.ofMinutes(5);

    @AssertTrue(message = "auth rate-limit windows must be positive")
    public boolean isWindowConfigurationValid() {
        return loginWindow != null
                && !loginWindow.isZero()
                && !loginWindow.isNegative()
                && socialWindow != null
                && !socialWindow.isZero()
                && !socialWindow.isNegative()
                && registrationIpWindow != null && !registrationIpWindow.isZero() && !registrationIpWindow.isNegative()
                && registrationEmailWindow != null && !registrationEmailWindow.isZero() && !registrationEmailWindow.isNegative()
                && pendingRegistrationRetention != null && !pendingRegistrationRetention.isZero() && !pendingRegistrationRetention.isNegative()
                && mapsWindow != null && !mapsWindow.isZero() && !mapsWindow.isNegative();
    }
}
