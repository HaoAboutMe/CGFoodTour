package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.repository.PasswordResetOtpRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.cangiuoc.cgfoodtour.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PendingRegistrationCleanupWorker {
    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deletePendingAccount(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (Boolean.TRUE.equals(user.getEmailVerified()) || Boolean.TRUE.equals(user.getEnabled())
                    || user.getDisabledAt() != null || user.getPendingVerificationExpiresAt() == null) {
                return;
            }
            verificationTokenRepository.deleteByUserId(user.getId());
            passwordResetOtpRepository.deleteByEmail(user.getEmail());
            userRepository.delete(user);
        });
    }
}
