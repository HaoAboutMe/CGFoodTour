package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.AuthRateLimitProperties;
import com.cangiuoc.cgfoodtour.exception.AppException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthAbuseProtectionServiceTest {
    @Test
    void limitsChallengeIssuancePerEmail() {
        AuthAbuseProtectionService service = service(defaultProperties(), Clock.systemUTC());
        for (int i = 0; i < 5; i++) {
            service.checkIssue("user@example.com", "192.0.2." + i);
        }

        assertThatThrownBy(() -> service.checkIssue("user@example.com", "192.0.2.10"))
                .isInstanceOf(AppException.class);
    }

    @Test
    void loginFailureLimitResetsAfterWindow() {
        AuthRateLimitProperties properties = defaultProperties();
        properties.setLoginEmailLimit(2);
        MutableClock clock = new MutableClock(Instant.parse("2026-10-17T00:00:00Z"));
        AuthAbuseProtectionService service = service(properties, clock);

        for (int i = 0; i < 2; i++) {
            service.checkLoginAttempt("user@example.com", "192.0.2.1");
            service.recordLoginFailure("user@example.com");
        }

        assertThatThrownBy(() -> service.checkLoginAttempt("user@example.com", "192.0.2.2"))
                .isInstanceOf(AppException.class);

        clock.advance(Duration.ofMinutes(16));
        service.checkLoginAttempt("user@example.com", "192.0.2.2");
    }

    @Test
    void refusesNewKeysWhenBoundIsReached() {
        AuthRateLimitProperties properties = defaultProperties();
        properties.setMaximumKeys(2);
        AuthAbuseProtectionService service = service(properties, Clock.systemUTC());

        service.checkSocialLoginAttempt("google", "192.0.2.1");
        service.checkSocialLoginAttempt("google", "192.0.2.2");

        assertThat(service.trackedKeyCount()).isEqualTo(2);
        assertThatThrownBy(() -> service.checkSocialLoginAttempt("google", "192.0.2.3"))
                .isInstanceOf(AppException.class);
        assertThat(service.trackedKeyCount()).isEqualTo(2);
    }

    private AuthRateLimitProperties defaultProperties() {
        return new AuthRateLimitProperties();
    }

    private AuthAbuseProtectionService service(AuthRateLimitProperties properties, Clock clock) {
        return new AuthAbuseProtectionService(properties, clock);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
