package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.AuthRateLimitProperties;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthAbuseProtectionService {
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final AuthRateLimitProperties properties;
    private final Clock clock;

    @Autowired
    public AuthAbuseProtectionService(AuthRateLimitProperties properties) {
        this(properties, Clock.systemUTC());
    }

    AuthAbuseProtectionService(AuthRateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public void checkIssue(String normalizedEmail, String clientIp) {
        consume("issue:email:" + normalizedEmail, 5, Duration.ofHours(1));
        consume("issue:ip:" + safeIp(clientIp), 20, Duration.ofHours(1));
    }

    public void checkVerificationAttempt(String normalizedEmail, String clientIp) {
        consume("verify:email:" + normalizedEmail, 10, Duration.ofMinutes(15));
        consume("verify:ip:" + safeIp(clientIp), 30, Duration.ofMinutes(15));
    }

    public void checkLoginAttempt(String normalizedEmail, String clientIp) {
        consume("login:ip:" + safeIp(clientIp), properties.getLoginIpLimit(), properties.getLoginWindow());
        requireBelowLimit("login:email:" + normalizedEmail, properties.getLoginEmailLimit());
    }

    public void recordLoginFailure(String normalizedEmail) {
        consume("login:email:" + normalizedEmail, properties.getLoginEmailLimit(), properties.getLoginWindow());
    }

    public void recordLoginSuccess(String normalizedEmail) {
        counters.remove("login:email:" + normalizedEmail);
    }

    public void checkSocialLoginAttempt(String provider, String clientIp) {
        consume("social:" + provider + ":ip:" + safeIp(clientIp),
                properties.getSocialIpLimit(), properties.getSocialWindow());
    }

    private synchronized void consume(String key, int limit, Duration window) {
        Instant now = clock.instant();
        WindowCounter current = activeCounter(key, now);
        if (current != null && current.count() >= limit) {
            throw new AppException(ErrorCode.AUTH_RATE_LIMITED);
        }

        if (current == null) {
            ensureCapacity(now);
            counters.put(key, new WindowCounter(now.plus(window), 1));
        } else {
            counters.put(key, new WindowCounter(current.expiresAt(), current.count() + 1));
        }
    }

    private synchronized void requireBelowLimit(String key, int limit) {
        WindowCounter current = activeCounter(key, clock.instant());
        if (current != null && current.count() >= limit) {
            throw new AppException(ErrorCode.AUTH_RATE_LIMITED);
        }
    }

    private WindowCounter activeCounter(String key, Instant now) {
        WindowCounter current = counters.get(key);
        if (current != null && !current.expiresAt().isAfter(now)) {
            counters.remove(key);
            return null;
        }
        return current;
    }

    private void ensureCapacity(Instant now) {
        if (counters.size() < properties.getMaximumKeys()) {
            return;
        }
        counters.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        if (counters.size() >= properties.getMaximumKeys()) {
            throw new AppException(ErrorCode.AUTH_RATE_LIMITED);
        }
    }

    int trackedKeyCount() {
        return counters.size();
    }

    private String safeIp(String clientIp) {
        return clientIp == null || clientIp.isBlank() ? "unknown" : clientIp;
    }

    private record WindowCounter(Instant expiresAt, int count) {}
}
