package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.AuthRateLimitProperties;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class PendingRegistrationService {
    private final UserRepository userRepository;
    private final AuthAbuseProtectionService abuseProtectionService;
    private final AuthRateLimitProperties properties;
    private final PendingRegistrationCleanupWorker cleanupWorker;

    @Value("${security.registration.ip-pepper:${jwt.signerKey}}")
    private String ipPepper;

    public RegistrationMetadata prepare(String normalizedEmail, String clientIp) {
        abuseProtectionService.checkRegistrationAttempt(normalizedEmail, clientIp);
        String ipHash = hashIp(clientIp);
        LocalDateTime now = LocalDateTime.now();
        long pending = userRepository
                .countByRegistrationIpHashAndEmailVerifiedFalseAndEnabledFalseAndPendingVerificationExpiresAtAfter(
                        ipHash, now);
        if (pending >= properties.getPendingRegistrationLimit()) {
            throw new AppException(ErrorCode.REGISTRATION_RATE_LIMITED);
        }
        return new RegistrationMetadata(ipHash, now.plus(properties.getPendingRegistrationRetention()));
    }

    @Scheduled(cron = "${security.registration.cleanup-cron:0 30 3 * * *}")
    public void cleanupExpiredPendingAccounts() {
        var expired = userRepository
                .findTop100ByEmailVerifiedFalseAndEnabledFalseAndDisabledAtIsNullAndPendingVerificationExpiresAtBeforeOrderByPendingVerificationExpiresAtAsc(
                        LocalDateTime.now());
        for (User user : expired) {
            try {
                cleanupWorker.deletePendingAccount(user.getId());
            } catch (RuntimeException exception) {
                log.error("Unable to clean expired pending account id {}", user.getId(), exception);
            }
        }
    }

    public void clear(User user) {
        user.setRegistrationIpHash(null);
        user.setPendingVerificationExpiresAt(null);
    }

    private String hashIp(String clientIp) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(ipPepper.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(clientIp.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to protect registration source", exception);
        }
    }

    public record RegistrationMetadata(String ipHash, LocalDateTime expiresAt) {}
}
