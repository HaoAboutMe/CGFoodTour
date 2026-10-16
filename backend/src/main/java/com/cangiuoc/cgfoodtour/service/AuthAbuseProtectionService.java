package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthAbuseProtectionService {
    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    public void checkIssue(String normalizedEmail, String clientIp) {
        check("issue:email:" + normalizedEmail, 5, Duration.ofHours(1));
        check("issue:ip:" + safeIp(clientIp), 20, Duration.ofHours(1));
    }

    public void checkVerificationAttempt(String normalizedEmail, String clientIp) {
        check("verify:email:" + normalizedEmail, 10, Duration.ofMinutes(15));
        check("verify:ip:" + safeIp(clientIp), 30, Duration.ofMinutes(15));
    }

    private void check(String key, int limit, Duration window) {
        Instant now = Instant.now();
        WindowCounter counter = counters.compute(key, (ignored, current) -> {
            if (current == null || !current.windowStart.plus(window).isAfter(now)) {
                return new WindowCounter(now, 1);
            }
            return new WindowCounter(current.windowStart, current.count + 1);
        });
        if (counter.count > limit) {
            throw new AppException(ErrorCode.AUTH_RATE_LIMITED);
        }

        if (counters.size() > 10_000) {
            counters.entrySet().removeIf(entry -> entry.getValue().windowStart.plus(Duration.ofHours(1)).isBefore(now));
        }
    }

    private String safeIp(String clientIp) {
        return clientIp == null || clientIp.isBlank() ? "unknown" : clientIp;
    }

    private record WindowCounter(Instant windowStart, int count) {}
}
