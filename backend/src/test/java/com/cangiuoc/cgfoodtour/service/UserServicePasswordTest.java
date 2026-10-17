package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.ChangePasswordRequest;
import com.cangiuoc.cgfoodtour.dto.request.UserUpdateRequest;
import com.cangiuoc.cgfoodtour.entity.Role;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.entity.VerificationToken;
import com.cangiuoc.cgfoodtour.mapper.UserMapper;
import com.cangiuoc.cgfoodtour.repository.RoleRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import com.cangiuoc.cgfoodtour.repository.VerificationTokenRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServicePasswordTest {
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock VerificationTokenRepository verificationTokenRepository;
    @Mock UserMapper userMapper;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock CloudinaryService cloudinaryService;
    @Mock ManagedImageService managedImageService;
    @InjectMocks UserService userService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void changePasswordIncrementsTokenVersion() {
        String email = "user@example.com";
        User user = User.builder()
                .email(email)
                .password("old-encoded")
                .tokenVersion(4L)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-password", "old-encoded")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("new-encoded");
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .oldPassword("old-password")
                .newPassword("new-password")
                .build();
        userService.changePassword(request);

        assertThat(user.getPassword()).isEqualTo("new-encoded");
        assertThat(user.getTokenVersion()).isEqualTo(5L);
        verify(userRepository).saveAndFlush(user);
    }

    @Test
    void changingRolesIncrementsTokenVersion() {
        Role admin = Role.builder().name("ADMIN").build();
        Role regular = Role.builder().name("USER").build();
        User user = User.builder()
                .id("user-1")
                .roles(new HashSet<>(List.of(admin)))
                .tokenVersion(3L)
                .build();
        UserUpdateRequest request = UserUpdateRequest.builder()
                .username("foodlover")
                .firstname("Food")
                .lastname("Lover")
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .roles(List.of("USER"))
                .build();
        when(userRepository.findByIdForUpdate("user-1")).thenReturn(Optional.of(user));
        when(roleRepository.findAllById(new HashSet<>(List.of("USER")))).thenReturn(List.of(regular));
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        userService.updateUser(request, "user-1");

        assertThat(user.getTokenVersion()).isEqualTo(4L);
        assertThat(user.getRoles()).extracting(Role::getName).containsExactly("USER");
    }

    @Test
    void disablingVerifiedUserRevokesExistingSessions() {
        User actor = User.builder().id("admin-1").email("admin@example.com").enabled(true).build();
        User target = User.builder().id("user-1").username("food-user").email("user@example.com")
                .emailVerified(true).enabled(true).tokenVersion(7L).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(actor.getEmail(), null));
        when(userRepository.findByEmail(actor.getEmail())).thenReturn(Optional.of(actor));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(userRepository.saveAndFlush(target)).thenReturn(target);

        userService.disableUser(target.getId(), "Policy violation");

        assertThat(target.getEnabled()).isFalse();
        assertThat(target.getEmailVerified()).isTrue();
        assertThat(target.getDisabledReason()).isEqualTo("Policy violation");
        assertThat(target.getTokenVersion()).isEqualTo(8L);
        verify(emailService).sendAccountDisabledEmail(
                "user@example.com", "food-user", "Policy violation");
    }

    @Test
    void enablingVerifiedUserSendsWelcomeBackEmailAndRevokesExistingSessions() {
        User actor = User.builder().id("admin-1").email("admin@example.com").enabled(true).build();
        User target = User.builder().id("user-1").username("food-user").email("user@example.com")
                .emailVerified(true).enabled(false).tokenVersion(8L)
                .disabledReason("Policy violation").disabledAt(LocalDateTime.now()).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(actor.getEmail(), null));
        when(userRepository.findByEmail(actor.getEmail())).thenReturn(Optional.of(actor));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(userRepository.saveAndFlush(target)).thenReturn(target);

        userService.enableUser(target.getId());

        assertThat(target.getEnabled()).isTrue();
        assertThat(target.getDisabledReason()).isNull();
        assertThat(target.getDisabledAt()).isNull();
        assertThat(target.getTokenVersion()).isEqualTo(9L);
        verify(emailService).sendAccountEnabledEmail("user@example.com", "food-user");
    }

    @Test
    void unchangedRolesDoNotRevokeSessions() {
        Role regular = Role.builder().name("USER").build();
        User user = User.builder().id("user-1").enabled(true)
                .roles(new HashSet<>(List.of(regular))).tokenVersion(3L).build();
        UserUpdateRequest request = UserUpdateRequest.builder()
                .username("foodlover").firstname("Food").lastname("Lover")
                .dateOfBirth(LocalDate.of(2000, 1, 1)).roles(List.of("USER")).build();
        when(userRepository.findByIdForUpdate("user-1")).thenReturn(Optional.of(user));
        when(roleRepository.findAllById(new HashSet<>(List.of("USER")))).thenReturn(List.of(regular));
        when(userRepository.saveAndFlush(user)).thenReturn(user);

        userService.updateUser(request, "user-1");

        assertThat(user.getTokenVersion()).isEqualTo(3L);
    }

    @Test
    void wrongCurrentPasswordDoesNotTurnIntoSessionExpired() {
        String email = "user@example.com";
        User user = User.builder()
                .email(email)
                .password("old-encoded")
                .tokenVersion(2L)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "old-encoded")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .oldPassword("wrong-password")
                .newPassword("new-password")
                .build();

        assertThatThrownBy(() -> userService.changePassword(request))
                .isInstanceOf(com.cangiuoc.cgfoodtour.exception.AppException.class)
                .satisfies(exception -> assertThat(((com.cangiuoc.cgfoodtour.exception.AppException) exception)
                        .getErrorCode()).isEqualTo(com.cangiuoc.cgfoodtour.exception.ErrorCode.PASSWORD_INCORRECT));
        assertThat(user.getPassword()).isEqualTo("old-encoded");
        assertThat(user.getTokenVersion()).isEqualTo(2L);
        verify(userRepository, never()).saveAndFlush(user);
    }

    @Test
    void resendVerificationRotatesExistingRowBeforeSendingEmail() {
        User user = User.builder()
                .id("user-1")
                .email("user@example.com")
                .emailVerified(false)
                .enabled(false)
                .build();
        LocalDateTime oldCreatedAt = LocalDateTime.now().minusMinutes(2);
        VerificationToken existingToken = VerificationToken.builder()
                .id("verification-1")
                .token("old-token")
                .user(user)
                .createdAt(oldCreatedAt)
                .expiryDate(oldCreatedAt.plusHours(24))
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(verificationTokenRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(existingToken));
        when(verificationTokenRepository.saveAndFlush(existingToken)).thenReturn(existingToken);

        userService.resendVerificationEmail(user.getEmail());

        assertThat(existingToken.getToken()).isNotBlank().isNotEqualTo("old-token");
        assertThat(existingToken.getCreatedAt()).isAfter(oldCreatedAt);
        assertThat(existingToken.getExpiryDate()).isEqualTo(existingToken.getCreatedAt().plusHours(24));
        verify(verificationTokenRepository, never()).delete(existingToken);
        InOrder persistenceBeforeEmail = inOrder(verificationTokenRepository, emailService);
        persistenceBeforeEmail.verify(verificationTokenRepository).saveAndFlush(existingToken);
        persistenceBeforeEmail.verify(emailService)
                .sendVerificationEmail(eq(user.getEmail()), eq(existingToken.getToken()));
    }

    @Test
    void resendVerificationDoesNotReportSuccessWhenSmtpFails() {
        User user = User.builder()
                .id("user-1")
                .email("user@example.com")
                .emailVerified(false)
                .enabled(false)
                .build();
        VerificationToken existingToken = VerificationToken.builder()
                .id("verification-1")
                .token("old-token")
                .user(user)
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .expiryDate(LocalDateTime.now().plusHours(23))
                .build();
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(verificationTokenRepository.findByUserId(user.getId()))
                .thenReturn(Optional.of(existingToken));
        when(verificationTokenRepository.saveAndFlush(existingToken)).thenReturn(existingToken);
        doThrow(new com.cangiuoc.cgfoodtour.exception.AppException(
                com.cangiuoc.cgfoodtour.exception.ErrorCode.EMAIL_SEND_FAILED))
                .when(emailService).sendVerificationEmail(eq(user.getEmail()), anyString());

        assertThatThrownBy(() -> userService.resendVerificationEmail(user.getEmail()))
                .isInstanceOf(com.cangiuoc.cgfoodtour.exception.AppException.class)
                .satisfies(exception -> assertThat(((com.cangiuoc.cgfoodtour.exception.AppException) exception)
                        .getErrorCode()).isEqualTo(com.cangiuoc.cgfoodtour.exception.ErrorCode.EMAIL_SEND_FAILED));
    }
}
