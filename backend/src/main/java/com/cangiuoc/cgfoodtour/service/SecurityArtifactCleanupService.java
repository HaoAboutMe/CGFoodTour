package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.repository.InvalidatedTokenRepository;
import com.cangiuoc.cgfoodtour.repository.PasswordResetOtpRepository;
import com.cangiuoc.cgfoodtour.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityArtifactCleanupService {
    private static final int BATCH_SIZE = 500;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final Clock businessClock;

    @Scheduled(cron = "${app.cleanup.security-artifacts-cron:0 45 3 * * *}",
            zone = "${app.business-zone:Asia/Ho_Chi_Minh}")
    @Transactional
    public void cleanup() {
        Instant now = businessClock.instant();
        LocalDateTime localNow = LocalDateTime.now(businessClock);
        var invalidated = invalidatedTokenRepository.findByExpiryTimeBeforeOrderByExpiryTimeAsc(
                Date.from(now), PageRequest.of(0, BATCH_SIZE));
        var otps = passwordResetOtpRepository.findCleanupCandidates(
                localNow, localNow.minusHours(24), PageRequest.of(0, BATCH_SIZE));
        var verifications = verificationTokenRepository.findByExpiryDateBeforeOrderByExpiryDateAsc(
                localNow.minusDays(7), PageRequest.of(0, BATCH_SIZE));
        invalidatedTokenRepository.deleteAllInBatch(invalidated);
        passwordResetOtpRepository.deleteAllInBatch(otps);
        verificationTokenRepository.deleteAllInBatch(verifications);
        log.info("Security cleanup deleted invalidatedTokens={}, otps={}, verificationTokens={}",
                invalidated.size(), otps.size(), verifications.size());
    }
}
