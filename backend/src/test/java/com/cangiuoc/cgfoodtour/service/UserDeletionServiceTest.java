package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.AdminDeleteUserRequest;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDeletionServiceTest {
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock StoreRepository storeRepository;
    @Mock FoodItemRepository foodItemRepository;
    @Mock StoreRatingRepository storeRatingRepository;
    @Mock StoreDailyReportRepository storeDailyReportRepository;
    @Mock UserSavedStoreRepository userSavedStoreRepository;
    @Mock VerificationTokenRepository verificationTokenRepository;
    @Mock PasswordResetOtpRepository passwordResetOtpRepository;
    @Mock StoreAuditLogRepository storeAuditLogRepository;
    @Mock UserDeletionAuditRepository userDeletionAuditRepository;
    @Mock ManagedImageService managedImageService;
    @InjectMocks UserDeletionService userDeletionService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void hardDeleteRemovesPersonalGraphAnonymizesAuditAndQueuesMediaCleanup() {
        User actor = User.builder().id("admin-1").email("admin@example.com").build();
        User target = User.builder().id("user-1").username("bad-user").email("bad@example.com")
                .avatarPublicId("avatars/bad-user").roles(new HashSet<>()).build();
        AdminDeleteUserRequest request = new AdminDeleteUserRequest();
        request.setConfirmation("bad-user");
        request.setReason("Repeated abusive content");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(actor.getEmail(), null));

        when(userRepository.findByEmail(actor.getEmail())).thenReturn(Optional.of(actor));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(storeRepository.findByOwnerId(target.getId())).thenReturn(List.of());
        when(userSavedStoreRepository.findByUserId(target.getId())).thenReturn(List.of());
        when(storeRatingRepository.findByUserId(target.getId())).thenReturn(List.of());

        userDeletionService.deleteUser(target.getId(), request);

        verify(userSavedStoreRepository).deleteByUserId(target.getId());
        verify(storeRatingRepository).deleteByUserId(target.getId());
        verify(storeDailyReportRepository).deleteByUserId(target.getId());
        verify(verificationTokenRepository).deleteByUserId(target.getId());
        verify(passwordResetOtpRepository).deleteByEmail(target.getEmail());
        verify(storeAuditLogRepository).anonymizeActor(target.getId());
        verify(userDeletionAuditRepository).anonymizeActor(target.getId());
        verify(userRepository).delete(target);
        verify(managedImageService).deleteAfterCommit("avatars/bad-user");
        verify(userDeletionAuditRepository).save(org.mockito.ArgumentMatchers.any());
    }
}
