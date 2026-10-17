package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.ReportClosedRequest;
import com.cangiuoc.cgfoodtour.dto.request.RatingRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreActionRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreRequest;
import com.cangiuoc.cgfoodtour.dto.response.FoodItemResponse;
import com.cangiuoc.cgfoodtour.dto.response.PublicStoreResponse;
import com.cangiuoc.cgfoodtour.dto.response.StoreResponse;
import com.cangiuoc.cgfoodtour.dto.response.PageResponse;
import com.cangiuoc.cgfoodtour.entity.*;
import com.cangiuoc.cgfoodtour.enums.RatingLevel;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.mapper.FoodItemMapper;
import com.cangiuoc.cgfoodtour.mapper.StoreMapper;
import com.cangiuoc.cgfoodtour.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import org.springframework.security.core.context.SecurityContextHolder;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreService {
    StoreRepository storeRepository;
    CategoryRepository categoryRepository;
    UserRepository userRepository;
    StoreRatingRepository storeRatingRepository;
    StoreDailyReportRepository storeDailyReportRepository;
    FoodItemRepository foodItemRepository;
    StoreAuditLogRepository storeAuditLogRepository;
    UserSavedStoreRepository userSavedStoreRepository;
    EmailService emailService;
    GoogleMapsUrlResolver googleMapsUrlResolver;
    StoreVisibilityPolicy storeVisibilityPolicy;
    ManagedImageService managedImageService;
    GoogleMapsAbuseProtectionService googleMapsAbuseProtectionService;

    StoreMapper storeMapper;
    FoodItemMapper foodItemMapper;

    private String normalizeCategoryName(String name) {
        if (name == null) return "store";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}", ""); // removes combining diacritical marks
        normalized = normalized.replace("đ", "d").replace("Đ", "d");
        normalized = normalized.toLowerCase().replaceAll("[^a-z0-9]", "");
        return normalized.isEmpty() ? "store" : normalized;
    }

    private boolean isAdmin(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()));
    }

    @Transactional
    public StoreResponse createStore(StoreRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        
        Store store = storeMapper.toStore(request);
        applyValidatedLocation(store, request);
        store.setCategory(category);
        store.setOwner(user);
        store.setStatus(StoreStatus.PENDING);
        store.setIsVerified(false);
        store.setRejectionReason(null);
        
        // Generate custom ID: normalized category name + UUID suffix
        String categoryPart = normalizeCategoryName(category.getName());
        String uuidPart = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        store.setId(categoryPart + uuidPart);

        store = storeRepository.save(store);
        return toStoreResponse(store);
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicStoreResponse> getStores(Integer categoryId, String query, String sort,
                                                       int page, int size, String email) {
        Page<Store> storePage = storeRepository.searchPublic(StoreStatus.APPROVED, categoryId,
                normalizeSearch(query), pageRequest(page, size, sort, false));
        BatchStoreData batch = loadBatchData(storePage.getContent(), email);
        List<PublicStoreResponse> content = storePage.getContent().stream()
                .map(store -> toPublicStoreResponse(store, batch))
                .toList();
        return PageResponse.from(storePage, content);
    }

    public PublicStoreResponse getStore(String id, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));
        if (!storeVisibilityPolicy.canViewPublicly(store)) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }
        return toPublicStoreResponse(store, email);
    }

    @Transactional(readOnly = true)
    public PageResponse<StoreResponse> getMyStores(String email, String status, String sort, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        StoreStatus parsedStatus = parseStatus(status);
        Page<Store> storePage = parsedStatus == null
                ? storeRepository.findByOwnerId(user.getId(), pageRequest(page, size, sort, true))
                : storeRepository.findByOwnerIdAndStatus(user.getId(), parsedStatus, pageRequest(page, size, sort, true));
        BatchStoreData batch = loadBatchData(storePage.getContent(), email);
        List<StoreResponse> content = storePage.getContent().stream()
                .map(store -> toStoreResponse(store, batch))
                .toList();
        return PageResponse.from(storePage, content);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public PageResponse<StoreResponse> getAdminStores(String email, String status, Integer categoryId,
                                                       String query, String sort,
                                                       int page, int size) {
        boolean recoveryRequested = "RECOVERY_REQUESTED".equalsIgnoreCase(status);
        StoreStatus parsedStatus = recoveryRequested ? null : parseStatus(status);
        Page<Store> storePage = storeRepository.searchAdmin(parsedStatus, categoryId, normalizeSearch(query),
                recoveryRequested, pageRequest(page, size, sort, true));
        BatchStoreData batch = loadBatchData(storePage.getContent(), email);
        List<StoreResponse> content = storePage.getContent().stream()
                .map(store -> toStoreResponse(store, batch))
                .toList();
        return PageResponse.from(storePage, content);
    }

    @Transactional
    public StoreResponse updateStore(String id, StoreRequest request, String email) {
        return updateStore(id, request, null, email);
    }

    @Transactional
    public StoreResponse updateStore(String id, StoreRequest request, MultipartFile banner, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        storeMapper.updateStore(store, request);
        applyValidatedLocation(store, request);
        store.setCategory(category);

        ManagedImageService.ManagedImage uploaded = null;
        boolean rollbackCleanupRegistered = false;
        String oldPublicId = store.getBannerImagePublicId();
        try {
            if (banner != null && !banner.isEmpty()) {
                uploaded = managedImageService.upload(banner, "stores", 2L * 1024 * 1024);
            }

            if (uploaded != null) {
                store.setBannerImageUrl(uploaded.url());
                store.setBannerImagePublicId(uploaded.publicId());
            }

            applyOwnerEditModerationState(store, userIsAdmin);

            Store saved = storeRepository.saveAndFlush(store);
            if (uploaded != null) {
                managedImageService.deleteAfterRollback(uploaded.publicId());
                rollbackCleanupRegistered = true;
                managedImageService.deleteAfterCommit(oldPublicId);
            }
            return toStoreResponse(saved, email);
        } catch (RuntimeException exception) {
            if (uploaded != null && !rollbackCleanupRegistered) {
                managedImageService.deleteBestEffort(uploaded.publicId());
            }
            throw exception;
        }
    }

    @Transactional
    public StoreResponse updateStoreBanner(String id, MultipartFile file, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (!storeVisibilityPolicy.canManage(store, user)) throw new AppException(ErrorCode.UNAUTHORIZED);
        boolean userIsAdmin = isAdmin(user);

        String oldPublicId = store.getBannerImagePublicId();
        var uploaded = managedImageService.upload(file, "stores", 2L * 1024 * 1024);
        boolean rollbackCleanupRegistered = false;
        try {
            store.setBannerImageUrl(uploaded.url());
            store.setBannerImagePublicId(uploaded.publicId());
            applyOwnerEditModerationState(store, userIsAdmin);
            Store saved = storeRepository.saveAndFlush(store);
            managedImageService.deleteAfterRollback(uploaded.publicId());
            rollbackCleanupRegistered = true;
            managedImageService.deleteAfterCommit(oldPublicId);
            return toStoreResponse(saved, email);
        } catch (RuntimeException exception) {
            if (!rollbackCleanupRegistered) managedImageService.deleteBestEffort(uploaded.publicId());
            throw exception;
        }
    }

    private void applyOwnerEditModerationState(Store store, boolean userIsAdmin) {
        if (!userIsAdmin && store.getStatus() != StoreStatus.HIDDEN) {
            store.setStatus(StoreStatus.PENDING);
            store.setIsVerified(false);
            store.setRejectionReason(null);
        }
    }

    @Transactional
    public void deleteStore(String id, String email) {
        hardDeleteStore(id, null, email);
    }

    @Transactional
    public StoreResponse hideStore(String id, StoreActionRequest request, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Business rule: Only APPROVED stores can be hidden
        if (store.getStatus() != StoreStatus.APPROVED) {
            throw new AppException(ErrorCode.INVALID_STORE_STATUS_FOR_HIDE);
        }

        String reason = request != null ? request.getReason() : null;
        if (userIsAdmin && (reason == null || reason.isBlank())) {
            throw new AppException(ErrorCode.STORE_REASON_REQUIRED);
        }

        store.setStatus(StoreStatus.HIDDEN);
        store.setHiddenByAdmin(userIsAdmin);
        store.setHideReason(reason);
        store = storeRepository.save(store);

        // Audit log
        StoreAuditLog auditLog = StoreAuditLog.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .actorId(user.getId())
                .actorEmail(user.getEmail())
                .actorRole(userIsAdmin ? "ADMIN" : "OWNER")
                .actionType("HIDE")
                .reason(reason)
                .build();
        storeAuditLogRepository.save(auditLog);

        // Send email to owner if performed by admin
        if (userIsAdmin && store.getOwner() != null && store.getOwner().getEmail() != null) {
            emailService.sendStoreStatusNotificationEmail(store.getOwner().getEmail(), store.getName(), "HIDE", reason);
        }

        return toStoreResponse(store);
    }

    @Transactional
    public StoreResponse recoverStore(String id, StoreActionRequest request, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Business rule: Only HIDDEN stores can be recovered
        if (store.getStatus() != StoreStatus.HIDDEN) {
            throw new AppException(ErrorCode.INVALID_STORE_STATUS_FOR_RECOVER);
        }

        // Business rule: If store was hidden by Admin, only Admin can recover it
        if (Boolean.TRUE.equals(store.getHiddenByAdmin()) && !userIsAdmin) {
            throw new AppException(ErrorCode.STORE_HIDDEN_BY_ADMIN_CANNOT_RECOVER);
        }

        String reason = request != null ? request.getReason() : null;
        store.setStatus(StoreStatus.APPROVED);
        store.setHiddenByAdmin(false);
        store.setHideReason(null);
        store.setRecoveryRequested(false);
        store.setRecoveryRequestReason(null);
        store.setRecoveryDeclineReason(null);
        store = storeRepository.save(store);

        // Audit log
        StoreAuditLog auditLog = StoreAuditLog.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .actorId(user.getId())
                .actorEmail(user.getEmail())
                .actorRole(userIsAdmin ? "ADMIN" : "OWNER")
                .actionType("RECOVER")
                .reason(reason)
                .build();
        storeAuditLogRepository.save(auditLog);

        return toStoreResponse(store);
    }

    @Transactional
    public StoreResponse requestStoreRecovery(String id, StoreActionRequest request, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (store.getStatus() != StoreStatus.HIDDEN || !Boolean.TRUE.equals(store.getHiddenByAdmin())) {
            throw new AppException(ErrorCode.INVALID_STORE_STATUS_FOR_RECOVER);
        }

        String reason = request != null ? request.getReason() : null;
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.RECOVERY_REQUEST_REASON_REQUIRED);
        }

        store.setRecoveryRequested(true);
        store.setRecoveryRequestReason(reason);
        store.setRecoveryDeclineReason(null);
        store = storeRepository.save(store);

        // Audit log
        StoreAuditLog auditLog = StoreAuditLog.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .actorId(user.getId())
                .actorEmail(user.getEmail())
                .actorRole(userIsAdmin ? "ADMIN" : "OWNER")
                .actionType("REQUEST_RECOVERY")
                .reason(reason)
                .build();
        storeAuditLogRepository.save(auditLog);

        return toStoreResponse(store);
    }

    @Transactional
    public StoreResponse rejectRecoveryRequest(String id, StoreActionRequest request, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!isAdmin(user)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (!Boolean.TRUE.equals(store.getRecoveryRequested())) {
            throw new AppException(ErrorCode.NO_PENDING_RECOVERY_REQUEST);
        }

        String reason = request != null ? request.getReason() : null;
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.STORE_REASON_REQUIRED);
        }

        store.setRecoveryRequested(false);
        store.setRecoveryDeclineReason(reason);
        // Note: Store status STAYS as HIDDEN and hiddenByAdmin STAYS as true!
        store = storeRepository.save(store);

        // Audit log
        StoreAuditLog auditLog = StoreAuditLog.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .actorId(user.getId())
                .actorEmail(user.getEmail())
                .actorRole("ADMIN")
                .actionType("REJECT_RECOVERY_REQUEST")
                .reason(reason)
                .build();
        storeAuditLogRepository.save(auditLog);

        // Send notification email to owner
        if (store.getOwner() != null && store.getOwner().getEmail() != null) {
            emailService.sendStoreStatusNotificationEmail(
                    store.getOwner().getEmail(),
                    store.getName(),
                    "REJECT_RECOVERY_REQUEST",
                    "Từ chối yêu cầu khôi phục. Lý do: " + reason
            );
        }

        return toStoreResponse(store);
    }

    @Transactional
    public void hardDeleteStore(String id, StoreActionRequest request, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String reason = request != null ? request.getReason() : null;
        if (userIsAdmin && (reason == null || reason.isBlank())) {
            throw new AppException(ErrorCode.STORE_REASON_REQUIRED);
        }

        // Audit log
        StoreAuditLog auditLog = StoreAuditLog.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .actorId(user.getId())
                .actorEmail(user.getEmail())
                .actorRole(userIsAdmin ? "ADMIN" : "OWNER")
                .actionType("HARD_DELETE")
                .reason(reason)
                .build();
        storeAuditLogRepository.save(auditLog);

        // Send email to owner if performed by admin
        if (userIsAdmin && store.getOwner() != null && store.getOwner().getEmail() != null) {
            emailService.sendStoreStatusNotificationEmail(store.getOwner().getEmail(), store.getName(), "HARD_DELETE", reason);
        }

        List<String> mediaPublicIds = new ArrayList<>();
        if (store.getBannerImagePublicId() != null) mediaPublicIds.add(store.getBannerImagePublicId());
        foodItemRepository.findByStoreId(store.getId()).stream()
                .map(FoodItem::getImagePublicId).filter(java.util.Objects::nonNull)
                .forEach(mediaPublicIds::add);

        // Delete all related records in child tables to prevent foreign key constraint errors
        foodItemRepository.deleteByStoreId(store.getId());
        storeRatingRepository.deleteByStoreId(store.getId());
        storeDailyReportRepository.deleteByStoreId(store.getId());
        userSavedStoreRepository.deleteByStoreId(store.getId());

        storeRepository.delete(store);
        mediaPublicIds.forEach(managedImageService::deleteAfterCommit);
    }

    @Transactional
    public StoreResponse approveStore(String id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        store.setStatus(StoreStatus.APPROVED);
        store.setIsVerified(true);
        store.setRejectionReason(null);

        store = storeRepository.save(store);
        return toStoreResponse(store);
    }

    @Transactional
    public StoreResponse rejectStore(String id, String reason) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        store.setStatus(StoreStatus.REJECTED);
        store.setIsVerified(false);
        store.setRejectionReason(reason);

        store = storeRepository.save(store);
        return toStoreResponse(store);
    }

    // Rate 1-touch
    @Transactional
    public StoreResponse rateStore(String storeId, RatingLevel level, String email) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StoreRating rating = storeRatingRepository.findByUserIdAndStoreId(user.getId(), storeId)
                .orElse(StoreRating.builder().userId(user.getId()).store(store).build());
        rating.setRatingLevel(level);
        storeRatingRepository.save(rating);

        // Recalculate denormalized counters
        int verySatisfied = (int) storeRatingRepository.countByStoreIdAndRatingLevel(storeId, RatingLevel.VERY_SATISFIED);
        int normal = (int) storeRatingRepository.countByStoreIdAndRatingLevel(storeId, RatingLevel.NORMAL);
        int notSatisfied = (int) storeRatingRepository.countByStoreIdAndRatingLevel(storeId, RatingLevel.NOT_SATISFIED);
        int total = verySatisfied + normal + notSatisfied;
        double rate = total == 0 ? 0.00 : (verySatisfied * 100.0 / total);

        store.setCountVerySatisfied(verySatisfied);
        store.setCountNormal(normal);
        store.setCountNotSatisfied(notSatisfied);
        store.setTotalVotes(total);
        store.setSatisfactionRate(rate);

        storeRepository.save(store);
        return toStoreResponse(store);
    }

    // Report Closed
    @Transactional
    public StoreResponse reportClosed(String storeId, ReportClosedRequest request, String email) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // GPS checks
        if (store.getLatitude() == null || store.getLongitude() == null) {
            throw new AppException(ErrorCode.GPS_OUT_OF_RANGE);
        }

        double distance = calculateDistanceInMeters(
                request.getLatitude(), request.getLongitude(),
                store.getLatitude(), store.getLongitude()
        );

        if (distance > 100.0) {
            throw new AppException(ErrorCode.GPS_OUT_OF_RANGE);
        }

        LocalDate today = LocalDate.now();
        if (storeDailyReportRepository.findByUserIdAndStoreIdAndReportDate(user.getId(), storeId, today).isPresent()) {
            throw new AppException(ErrorCode.REPORT_ALREADY_SUBMITTED);
        }

        StoreDailyReport report = StoreDailyReport.builder()
                .userId(user.getId())
                .store(store)
                .reportDate(today)
                .build();
        storeDailyReportRepository.save(report);

        return toStoreResponse(store);
    }

    // Random store
    public PublicStoreResponse getRandomStore(Integer categoryId, String email) {
        List<Store> stores = storeRepository.findRandomPublic(StoreStatus.APPROVED, categoryId,
                PageRequest.of(0, 1));
        if (stores.isEmpty()) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }
        return toPublicStoreResponse(stores.get(0), email);
    }

    @Transactional(readOnly = true)
    public List<PublicStoreResponse> getRanking(String email, int limit) {
        if (limit < 1 || limit > 100) throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        List<Store> stores = storeRepository.findRanking(StoreStatus.APPROVED, 10,
                PageRequest.of(0, limit));
        BatchStoreData batch = loadBatchData(stores, email);
        return stores.stream().map(store -> toPublicStoreResponse(store, batch)).toList();
    }

    // Scheduled Cron Job to clear reports at 00:00 daily
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailyReports() {
        log.info("Resetting daily store closed reports via scheduled cron job...");
        storeDailyReportRepository.deleteAllInBatch();
    }

    // Save Store Toggle & Saved List Methods
    @Transactional
    public PublicStoreResponse toggleSaveStore(String storeId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));
        if (!storeVisibilityPolicy.canViewPublicly(store)) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }

        Optional<UserSavedStore> existingSave = userSavedStoreRepository.findByUserIdAndStoreId(user.getId(), store.getId());

        if (existingSave.isPresent()) {
            userSavedStoreRepository.delete(existingSave.get());
            int newCount = Math.max(0, (store.getSavedCount() != null ? store.getSavedCount() : 1) - 1);
            store.setSavedCount(newCount);
            storeRepository.save(store);
            PublicStoreResponse response = toPublicStoreResponse(store, email);
            response.setIsSaved(false);
            return response;
        } else {
            UserSavedStore savedStore = UserSavedStore.builder()
                    .user(user)
                    .store(store)
                    .build();
            userSavedStoreRepository.save(savedStore);

            int newCount = (store.getSavedCount() != null ? store.getSavedCount() : 0) + 1;
            store.setSavedCount(newCount);
            storeRepository.save(store);

            PublicStoreResponse response = toPublicStoreResponse(store, email);
            response.setIsSaved(true);
            return response;
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicStoreResponse> getSavedStoresForUser(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        var savedPage = userSavedStoreRepository.findPublicSavedStores(user.getId(),
                savedPageRequest(page, size));
        List<Store> stores = savedPage.getContent().stream().map(UserSavedStore::getStore).toList();
        BatchStoreData batch = loadBatchData(stores, email);
        List<PublicStoreResponse> content = stores.stream()
                .map(store -> {
                    PublicStoreResponse response = toPublicStoreResponse(store, batch);
                    response.setIsSaved(true);
                    return response;
                }).toList();
        return PageResponse.from(savedPage, content);
    }

    // Helper: Map Store Entity to StoreResponse DTO including food items, reported status, savedCount & isSaved
    private StoreResponse toStoreResponse(Store store, String userEmail) {
        StoreResponse response = storeMapper.toStoreResponse(store);
        
        // Fetch and map food items
        List<FoodItem> items = foodItemRepository.findByStoreId(store.getId());
        List<FoodItemResponse> itemResponses = foodItemMapper.toFoodItemResponseList(items);
        response.setFoodItems(itemResponses);

        // Fetch reported closed status (warning if >= 3 reports)
        long reportCount = storeDailyReportRepository.countByStoreIdAndReportDate(store.getId(), LocalDate.now());
        response.setIsReportedClosed(reportCount >= 3);

        // Populate savedCount and isSaved
        response.setSavedCount(store.getSavedCount() != null ? store.getSavedCount() : 0);
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                response.setIsSaved(userSavedStoreRepository.existsByUserIdAndStoreId(user.getId(), store.getId()));
            } else {
                response.setIsSaved(false);
            }
        } else {
            response.setIsSaved(false);
        }

        return response;
    }

    private StoreResponse toStoreResponse(Store store) {
        String email = null;
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            email = auth.getName();
        }
        return toStoreResponse(store, email);
    }

    private PublicStoreResponse toPublicStoreResponse(Store store, String userEmail) {
        PublicStoreResponse response = storeMapper.toPublicStoreResponse(store);

        List<FoodItem> items = foodItemRepository.findByStoreId(store.getId());
        response.setFoodItems(foodItemMapper.toFoodItemResponseList(items));

        long reportCount = storeDailyReportRepository.countByStoreIdAndReportDate(store.getId(), LocalDate.now());
        response.setIsReportedClosed(reportCount >= 3);
        response.setSavedCount(store.getSavedCount() != null ? store.getSavedCount() : 0);

        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            response.setIsSaved(user != null
                    && userSavedStoreRepository.existsByUserIdAndStoreId(user.getId(), store.getId()));
        } else {
            response.setIsSaved(false);
        }
        return response;
    }

    private BatchStoreData loadBatchData(List<Store> stores, String userEmail) {
        if (stores.isEmpty()) return new BatchStoreData(Map.of(), Map.of(), Set.of());
        List<String> storeIds = stores.stream().map(Store::getId).toList();

        Map<String, List<FoodItem>> foodByStore = foodItemRepository.findByStoreIdIn(storeIds).stream()
                .collect(Collectors.groupingBy(item -> item.getStore().getId()));
        Map<String, Long> reportCounts = storeDailyReportRepository
                .countForStores(storeIds, LocalDate.now()).stream()
                .collect(Collectors.toMap(StoreDailyReportRepository.StoreReportCount::getStoreId,
                        StoreDailyReportRepository.StoreReportCount::getReportCount));

        Set<String> savedStoreIds = Set.of();
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                savedStoreIds = new HashSet<>(userSavedStoreRepository.findSavedStoreIds(user.getId(), storeIds));
            }
        }
        return new BatchStoreData(foodByStore, reportCounts, savedStoreIds);
    }

    private PublicStoreResponse toPublicStoreResponse(Store store, BatchStoreData batch) {
        PublicStoreResponse response = storeMapper.toPublicStoreResponse(store);
        response.setFoodItems(foodItemMapper.toFoodItemResponseList(
                batch.foodByStore().getOrDefault(store.getId(), List.of())));
        response.setIsReportedClosed(batch.reportCounts().getOrDefault(store.getId(), 0L) >= 3);
        response.setSavedCount(store.getSavedCount() == null ? 0 : store.getSavedCount());
        response.setIsSaved(batch.savedStoreIds().contains(store.getId()));
        return response;
    }

    private StoreResponse toStoreResponse(Store store, BatchStoreData batch) {
        StoreResponse response = storeMapper.toStoreResponse(store);
        response.setFoodItems(foodItemMapper.toFoodItemResponseList(
                batch.foodByStore().getOrDefault(store.getId(), List.of())));
        response.setIsReportedClosed(batch.reportCounts().getOrDefault(store.getId(), 0L) >= 3);
        response.setSavedCount(store.getSavedCount() == null ? 0 : store.getSavedCount());
        response.setIsSaved(batch.savedStoreIds().contains(store.getId()));
        return response;
    }

    private PageRequest pageRequest(int page, int size, String sort, boolean management) {
        if (page < 0 || size < 1 || size > 100) throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        String value = sort == null || sort.isBlank() ? "newest" : sort;
        Sort sorting = switch (value) {
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "nameAsc" -> Sort.by(Sort.Direction.ASC, "name");
            case "ratingDesc" -> Sort.by(Sort.Direction.DESC, "satisfactionRate");
            case "savedDesc" -> Sort.by(Sort.Direction.DESC, "savedCount");
            case "statusAsc" -> {
                if (!management) throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
                yield Sort.by(Sort.Direction.ASC, "status").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            }
            default -> throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        };
        return PageRequest.of(page, size, sorting);
    }

    private PageRequest savedPageRequest(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "savedAt"));
    }

    private StoreStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return StoreStatus.valueOf(status.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        }
    }

    private String normalizeSearch(String query) {
        if (query == null || query.isBlank()) return null;
        String normalized = query.trim();
        if (normalized.length() > 100) throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        return normalized;
    }

    private record BatchStoreData(Map<String, List<FoodItem>> foodByStore,
                                  Map<String, Long> reportCounts,
                                  Set<String> savedStoreIds) {}

    // Haversine formula to compute distance in meters
    private double calculateDistanceInMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth radius in meters
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public Map<String, String> parseGoogleMapsUrl(String inputUrl) {
        if (inputUrl == null || inputUrl.isBlank()) {
            return Collections.emptyMap();
        }
        String value = inputUrl.trim();
        if (value.length() > 2048 || value.chars().anyMatch(Character::isISOControl)) {
            return Collections.emptyMap();
        }

        Map<String, String> directCoordinates = extractCoordinatesFromText(value);
        if (!directCoordinates.isEmpty()) {
            return directCoordinates;
        }

        for (String candidate : googleMapsUrlResolver.resolve(value)) {
            Map<String, String> coordinates = extractCoordinatesFromText(candidate);
            if (!coordinates.isEmpty()) {
                return coordinates;
            }
        }
        return Collections.emptyMap();
    }

    public Map<String, String> parseGoogleMapsUrl(String inputUrl, String email, String clientIp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return googleMapsAbuseProtectionService.resolve(user.getId(), clientIp, inputUrl,
                () -> parseGoogleMapsUrl(inputUrl));
    }

    private void applyValidatedLocation(Store store, StoreRequest request) {
        if (request.getMapUrl() != null && !request.getMapUrl().isBlank()) {
            var resolution = googleMapsUrlResolver.resolveMap(request.getMapUrl())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_MAP_URL));
            store.setMapUrl(resolution.normalizedUrl());
            store.setLatitude(resolution.latitude());
            store.setLongitude(resolution.longitude());
            return;
        }

        Double latitude = request.getLatitude();
        Double longitude = request.getLongitude();
        if (latitude == null && longitude == null) {
            store.setMapUrl(null);
            store.setLatitude(null);
            store.setLongitude(null);
            return;
        }
        if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180
                || !Double.isFinite(latitude) || !Double.isFinite(longitude)) {
            throw new AppException(ErrorCode.INVALID_MAP_URL);
        }
        store.setLatitude(latitude);
        store.setLongitude(longitude);
        store.setMapUrl("https://www.google.com/maps/search/?api=1&query=" + latitude + "," + longitude);
    }

    private Map<String, String> extractCoordinatesFromText(String text) {
        if (text == null || text.isBlank()) return Collections.emptyMap();

        // 1. !3d...!4d... (can be contiguous or non-contiguous in URL params)
        var dMatcher = Pattern.compile("!3d(-?\\d+\\.\\d+).*?!4d(-?\\d+\\.\\d+)").matcher(text);
        if (dMatcher.find()) {
            return Map.of("latitude", dMatcher.group(1), "longitude", dMatcher.group(2));
        }

        var lat3d = Pattern.compile("!3d(-?\\d+\\.\\d+)").matcher(text);
        var lng4d = Pattern.compile("!4d(-?\\d+\\.\\d+)").matcher(text);
        if (lat3d.find() && lng4d.find()) {
            return Map.of("latitude", lat3d.group(1), "longitude", lng4d.group(1));
        }

        // 2. @lat,lng
        var atMatcher = Pattern.compile("@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)").matcher(text);
        if (atMatcher.find()) {
            return Map.of("latitude", atMatcher.group(1), "longitude", atMatcher.group(2));
        }

        // 3. q=lat,lng or query=lat,lng or ll=lat,lng or center=lat,lng
        var qMatcher = Pattern.compile("[?&](?:q|ll|query|destination|near|center|point)=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)").matcher(text);
        if (qMatcher.find()) {
            return Map.of("latitude", qMatcher.group(1), "longitude", qMatcher.group(2));
        }

        // 4. /place/lat,lng or /search/lat,lng or /dir/lat,lng
        var pMatcher = Pattern.compile("\\/(?:place|dir|search|maps)\\/(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)").matcher(text);
        if (pMatcher.find()) {
            return Map.of("latitude", pMatcher.group(1), "longitude", pMatcher.group(2));
        }

        // 5. Direct lat, lng pattern (e.g., 10.51234, 106.65432)
        var directMatcher = Pattern.compile("(-?\\d{1,2}\\.\\d+)\\s*[,;\\s]\\s*(-?\\d{1,3}\\.\\d+)").matcher(text);
        if (directMatcher.find()) {
            try {
                double lat = Double.parseDouble(directMatcher.group(1));
                double lng = Double.parseDouble(directMatcher.group(2));
                if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                    return Map.of("latitude", directMatcher.group(1), "longitude", directMatcher.group(2));
                }
            } catch (Exception ignored) {}
        }

        return Collections.emptyMap();
    }
}
