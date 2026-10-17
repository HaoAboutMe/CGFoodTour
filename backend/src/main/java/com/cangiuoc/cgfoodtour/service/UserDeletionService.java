package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.AdminDeleteUserRequest;
import com.cangiuoc.cgfoodtour.entity.*;
import com.cangiuoc.cgfoodtour.enums.RatingLevel;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserDeletionService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StoreRepository storeRepository;
    private final FoodItemRepository foodItemRepository;
    private final StoreRatingRepository storeRatingRepository;
    private final StoreDailyReportRepository storeDailyReportRepository;
    private final UserSavedStoreRepository userSavedStoreRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final StoreAuditLogRepository storeAuditLogRepository;
    private final UserDeletionAuditRepository userDeletionAuditRepository;
    private final ManagedImageService managedImageService;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteUser(String userId, AdminDeleteUserRequest request) {
        roleRepository.findByNameForUpdate("ADMIN");
        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        User target = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (actor.getId().equals(target.getId())) {
            throw new AppException(ErrorCode.ACCOUNT_SELF_ACTION_FORBIDDEN);
        }
        if (target.getUsername() == null || !target.getUsername().equals(request.getConfirmation())) {
            throw new AppException(ErrorCode.DELETE_CONFIRMATION_INVALID);
        }
        if (isAdmin(target) && Boolean.TRUE.equals(target.getEnabled()) && userRepository.countActiveAdmins() <= 1) {
            throw new AppException(ErrorCode.LAST_ADMIN_PROTECTED);
        }

        List<Store> ownedStores = storeRepository.findByOwnerId(target.getId());
        Set<String> ownedStoreIds = new HashSet<>();
        Set<String> affectedStoreIds = new HashSet<>();
        List<String> mediaPublicIds = new ArrayList<>();
        if (target.getAvatarPublicId() != null) mediaPublicIds.add(target.getAvatarPublicId());

        userSavedStoreRepository.findByUserId(target.getId()).stream()
                .map(UserSavedStore::getStore).filter(Objects::nonNull).map(Store::getId)
                .forEach(affectedStoreIds::add);
        storeRatingRepository.findByUserId(target.getId()).stream()
                .map(StoreRating::getStore).filter(Objects::nonNull).map(Store::getId)
                .forEach(affectedStoreIds::add);

        userDeletionAuditRepository.save(UserDeletionAudit.builder()
                .targetReference(UUID.randomUUID().toString())
                .actorId(actor.getId())
                .actorEmail(actor.getEmail())
                .reason(request.getReason().trim())
                .deletedStoreCount(ownedStores.size())
                .build());

        for (Store store : ownedStores) {
            ownedStoreIds.add(store.getId());
            if (store.getBannerImagePublicId() != null) mediaPublicIds.add(store.getBannerImagePublicId());
            List<FoodItem> foodItems = foodItemRepository.findByStoreId(store.getId());
            foodItems.stream().map(FoodItem::getImagePublicId).filter(Objects::nonNull).forEach(mediaPublicIds::add);

            storeAuditLogRepository.save(StoreAuditLog.builder()
                    .storeId(store.getId())
                    .storeName(store.getName())
                    .actorId(actor.getId())
                    .actorEmail(actor.getEmail())
                    .actorRole("ADMIN")
                    .actionType("USER_DELETION_CASCADE")
                    .reason(request.getReason().trim())
                    .build());
            userSavedStoreRepository.deleteByStoreId(store.getId());
            storeRatingRepository.deleteByStoreId(store.getId());
            storeDailyReportRepository.deleteByStoreId(store.getId());
            foodItemRepository.deleteByStoreId(store.getId());
            storeRepository.delete(store);
        }

        userSavedStoreRepository.deleteByUserId(target.getId());
        storeRatingRepository.deleteByUserId(target.getId());
        storeDailyReportRepository.deleteByUserId(target.getId());

        affectedStoreIds.removeAll(ownedStoreIds);
        for (String affectedStoreId : affectedStoreIds) {
            storeRepository.findById(affectedStoreId).ifPresent(this::recalculateCounters);
        }

        verificationTokenRepository.deleteByUserId(target.getId());
        passwordResetOtpRepository.deleteByEmail(target.getEmail());
        storeAuditLogRepository.anonymizeActor(target.getId());
        userDeletionAuditRepository.anonymizeActor(target.getId());
        if (target.getRoles() != null) target.getRoles().clear();
        userRepository.saveAndFlush(target);
        userRepository.delete(target);
        userRepository.flush();

        cleanupMediaAfterCommit(mediaPublicIds);
    }

    private void recalculateCounters(Store store) {
        int verySatisfied = (int) storeRatingRepository.countByStoreIdAndRatingLevel(store.getId(), RatingLevel.VERY_SATISFIED);
        int normal = (int) storeRatingRepository.countByStoreIdAndRatingLevel(store.getId(), RatingLevel.NORMAL);
        int notSatisfied = (int) storeRatingRepository.countByStoreIdAndRatingLevel(store.getId(), RatingLevel.NOT_SATISFIED);
        int total = verySatisfied + normal + notSatisfied;
        store.setCountVerySatisfied(verySatisfied);
        store.setCountNormal(normal);
        store.setCountNotSatisfied(notSatisfied);
        store.setTotalVotes(total);
        store.setSatisfactionRate(total == 0 ? 0D : verySatisfied * 100D / total);
        store.setSavedCount(userSavedStoreRepository.countByStoreId(store.getId()));
        storeRepository.save(store);
    }

    private void cleanupMediaAfterCommit(List<String> publicIds) {
        publicIds.forEach(managedImageService::deleteAfterCommit);
    }

    private boolean isAdmin(User user) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()));
    }
}
