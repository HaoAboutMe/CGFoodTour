package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.repository.PasswordResetOtpRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.cangiuoc.cgfoodtour.repository.VerificationTokenRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PendingRegistrationCleanupWorkerTest {
    private final UserRepository userRepository = mock(UserRepository.class);
    private final VerificationTokenRepository verificationTokenRepository = mock(VerificationTokenRepository.class);
    private final PasswordResetOtpRepository passwordResetOtpRepository = mock(PasswordResetOtpRepository.class);
    private final PendingRegistrationCleanupWorker worker = new PendingRegistrationCleanupWorker(
            userRepository, verificationTokenRepository, passwordResetOtpRepository);

    @Test
    void deletesOnlyExpiredPendingRegistrationData() {
        User user = pendingUser();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        worker.deletePendingAccount("user-1");

        verify(verificationTokenRepository).deleteByUserId("user-1");
        verify(passwordResetOtpRepository).deleteByEmail("pending@example.com");
        verify(userRepository).delete(user);
    }

    @Test
    void keepsAccountThatWasDisabledByAdmin() {
        User user = pendingUser();
        user.setDisabledAt(LocalDateTime.now().minusDays(1));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        worker.deletePendingAccount("user-1");

        verify(verificationTokenRepository, never()).deleteByUserId("user-1");
        verify(passwordResetOtpRepository, never()).deleteByEmail("pending@example.com");
        verify(userRepository, never()).delete(user);
    }

    private User pendingUser() {
        return User.builder()
                .id("user-1")
                .email("pending@example.com")
                .enabled(false)
                .emailVerified(false)
                .pendingVerificationExpiresAt(LocalDateTime.now().minusDays(1))
                .build();
    }
}
