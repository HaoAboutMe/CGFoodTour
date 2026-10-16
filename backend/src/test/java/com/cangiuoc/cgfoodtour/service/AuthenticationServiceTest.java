package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.AuthenticationRequest;
import com.cangiuoc.cgfoodtour.dto.request.ForgotPasswordRequest;
import com.cangiuoc.cgfoodtour.dto.request.LogOutRequest;
import com.cangiuoc.cgfoodtour.dto.request.RefreshRequest;
import com.cangiuoc.cgfoodtour.dto.request.VerifyOtpRequest;
import com.cangiuoc.cgfoodtour.entity.InvalidatedToken;
import com.cangiuoc.cgfoodtour.entity.PasswordResetOtp;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.repository.InvalidatedTokenRepository;
import com.cangiuoc.cgfoodtour.repository.PasswordResetOtpRepository;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock InvalidatedTokenRepository invalidatedTokenRepository;
    @Mock PasswordResetOtpRepository passwordResetOtpRepository;
    @Mock AuthAbuseProtectionService authAbuseProtectionService;
    @Mock EmailService emailService;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks AuthenticationService authenticationService;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authenticationService, "SIGNER_KEY",
                "1234567890123456789012345678901212345678901234567890123456789012");
        ReflectionTestUtils.setField(authenticationService, "VALID_DURATION", 300L);
        ReflectionTestUtils.setField(authenticationService, "REFRESHABLE_DURATION", 604800L);
        ReflectionTestUtils.setField(authenticationService, "OTP_PEPPER", "test-only-otp-pepper");
        user = User.builder()
                .id("user-1")
                .email("user@example.com")
                .password("encoded")
                .enabled(true)
                .emailVerified(true)
                .roles(new HashSet<>())
                .build();
    }

    @Test
    void loginAndRefreshUseDistinctTypedTokensAndRotateRefreshToken() throws Exception {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded")).thenReturn(true);
        when(invalidatedTokenRepository.existsById(any())).thenReturn(false);

        AuthenticationRequest login = new AuthenticationRequest();
        login.setEmail(user.getEmail());
        login.setPassword("password123");
        var pair = authenticationService.authenticate(login);

        assertThat(pair.getAccessToken()).isNotBlank();
        assertThat(pair.getRefreshToken()).isNotBlank().isNotEqualTo(pair.getAccessToken());
        assertThat(SignedJWT.parse(pair.getAccessToken()).getJWTClaimsSet().getStringClaim("typ"))
                .isEqualTo("access");
        assertThat(SignedJWT.parse(pair.getRefreshToken()).getJWTClaimsSet().getStringClaim("typ"))
                .isEqualTo("refresh");

        var rotated = authenticationService.refreshToken(
                RefreshRequest.builder().refreshToken(pair.getRefreshToken()).build());

        assertThat(rotated.getRefreshToken()).isNotEqualTo(pair.getRefreshToken());
        verify(invalidatedTokenRepository).save(any(InvalidatedToken.class));
    }

    @Test
    void logoutRevokesBothAccessAndRefreshTokens() throws Exception {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded")).thenReturn(true);
        when(invalidatedTokenRepository.existsById(any())).thenReturn(false);

        AuthenticationRequest login = new AuthenticationRequest();
        login.setEmail(user.getEmail());
        login.setPassword("password123");
        var pair = authenticationService.authenticate(login);

        authenticationService.logout(LogOutRequest.builder()
                .accessToken(pair.getAccessToken())
                .refreshToken(pair.getRefreshToken())
                .build());

        ArgumentCaptor<InvalidatedToken> revokedTokens = ArgumentCaptor.forClass(InvalidatedToken.class);
        verify(invalidatedTokenRepository, times(2)).save(revokedTokens.capture());
        assertThat(revokedTokens.getAllValues())
                .extracting(InvalidatedToken::getId)
                .containsExactlyInAnyOrder(
                        SignedJWT.parse(pair.getAccessToken()).getJWTClaimsSet().getJWTID(),
                        SignedJWT.parse(pair.getRefreshToken()).getJWTClaimsSet().getJWTID());
    }

    @Test
    void invalidAccessTokenDoesNotPreventRefreshTokenRevocation() throws Exception {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded")).thenReturn(true);
        when(invalidatedTokenRepository.existsById(any())).thenReturn(false);

        AuthenticationRequest login = new AuthenticationRequest();
        login.setEmail(user.getEmail());
        login.setPassword("password123");
        var pair = authenticationService.authenticate(login);

        authenticationService.logout(LogOutRequest.builder()
                .accessToken("malformed-access-token")
                .refreshToken(pair.getRefreshToken())
                .build());

        ArgumentCaptor<InvalidatedToken> revokedToken = ArgumentCaptor.forClass(InvalidatedToken.class);
        verify(invalidatedTokenRepository).save(revokedToken.capture());
        assertThat(revokedToken.getValue().getId())
                .isEqualTo(SignedJWT.parse(pair.getRefreshToken()).getJWTClaimsSet().getJWTID());
    }

    @Test
    void forgotPasswordStoresOnlyOtpHash() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("USER@example.com");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordResetOtpRepository.findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc("user@example.com"))
                .thenReturn(Optional.empty());
        when(passwordResetOtpRepository.countByEmailAndCreatedAtAfter(any(), any())).thenReturn(0L);

        authenticationService.forgotPassword(request, "127.0.0.1");

        ArgumentCaptor<PasswordResetOtp> challenge = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(passwordResetOtpRepository).save(challenge.capture());
        assertThat(challenge.getValue().getOtpHash()).hasSize(64).matches("[0-9a-f]{64}");
        verify(emailService).sendOtpEmail(eq("user@example.com"), matches("\\d{6}"));
    }

    @Test
    void fifthInvalidOtpAttemptLocksChallenge() {
        PasswordResetOtp challenge = PasswordResetOtp.builder()
                .email("user@example.com")
                .otpHash("0".repeat(64))
                .failedAttempts(0)
                .isUsed(false)
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .build();
        when(passwordResetOtpRepository
                .findFirstByEmailAndIsUsedFalseOrderByCreatedAtDesc("user@example.com"))
                .thenReturn(Optional.of(challenge));
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("user@example.com");
        request.setOtp("123456");

        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> authenticationService.verifyOtp(request, "127.0.0.1"))
                    .isInstanceOf(com.cangiuoc.cgfoodtour.exception.AppException.class);
        }

        assertThat(challenge.getFailedAttempts()).isEqualTo(5);
        assertThat(challenge.getIsUsed()).isTrue();
    }
}
