package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.ReportClosedRequest;
import com.cangiuoc.cgfoodtour.dto.request.RatingRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreActionRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreRequest;
import com.cangiuoc.cgfoodtour.dto.response.FoodItemResponse;
import com.cangiuoc.cgfoodtour.dto.response.StoreResponse;
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

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
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
    EmailService emailService;

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

    public List<StoreResponse> getStores(Integer categoryId, String email) {
        User currentUser = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        boolean userIsAdmin = isAdmin(currentUser);

        List<Store> allStores;
        if (categoryId != null) {
            allStores = storeRepository.findByCategoryId(categoryId);
        } else {
            allStores = storeRepository.findAll();
        }

        List<StoreResponse> responses = new ArrayList<>();
        for (Store store : allStores) {
            // Permission filter:
            // 1. Admin can see all stores
            // 2. Owner can see their own stores (even if pending/rejected)
            // 3. Regular users can only see APPROVED stores
            boolean canSee = userIsAdmin 
                    || store.getStatus() == StoreStatus.APPROVED 
                    || (currentUser != null && store.getOwner() != null && currentUser.getId().equals(store.getOwner().getId()));

            if (canSee) {
                responses.add(toStoreResponse(store));
            }
        }
        return responses;
    }

    public StoreResponse getStore(String id, String email) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User currentUser = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        boolean userIsAdmin = isAdmin(currentUser);

        boolean canSee = userIsAdmin 
                || store.getStatus() == StoreStatus.APPROVED 
                || (currentUser != null && store.getOwner() != null && currentUser.getId().equals(store.getOwner().getId()));

        if (!canSee) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return toStoreResponse(store);
    }

    @Transactional
    public StoreResponse updateStore(String id, StoreRequest request, String email) {
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
        store.setCategory(category);

        // If updated by owner, reset verification & status to pending for Admin review
        if (!userIsAdmin) {
            store.setStatus(StoreStatus.PENDING);
            store.setIsVerified(false);
            store.setRejectionReason(null);
        }

        store = storeRepository.save(store);
        return toStoreResponse(store);
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

        String reason = request != null ? request.getReason() : null;
        store.setStatus(StoreStatus.APPROVED);
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

        foodItemRepository.deleteByStoreId(store.getId());
        storeRepository.delete(store);
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
    public StoreResponse getRandomStore(Integer categoryId) {
        List<Store> stores;
        if (categoryId != null) {
            stores = storeRepository.findByCategoryId(categoryId);
        } else {
            stores = storeRepository.findAll();
        }

        stores = stores.stream()
                .filter(s -> s.getStatus() == StoreStatus.APPROVED)
                .collect(Collectors.toList());

        if (stores.isEmpty()) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }

        Store randomStore = stores.get(new Random().nextInt(stores.size()));
        return toStoreResponse(randomStore);
    }

    // Ranking API
    public List<StoreResponse> getRanking() {
        // Minimum 10 votes to enter ranking
        List<Store> stores = storeRepository.findByTotalVotesGreaterThanEqualOrderBySatisfactionRateDescTotalVotesDesc(10);
        List<StoreResponse> responses = new ArrayList<>();
        for (Store store : stores) {
            if (store.getStatus() == StoreStatus.APPROVED) {
                responses.add(toStoreResponse(store));
            }
        }
        return responses;
    }

    // Scheduled Cron Job to clear reports at 00:00 daily
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailyReports() {
        log.info("Resetting daily store closed reports via scheduled cron job...");
        storeDailyReportRepository.deleteAllInBatch();
    }

    // Helper: Map Store Entity to StoreResponse DTO including food items & reported status
    private StoreResponse toStoreResponse(Store store) {
        StoreResponse response = storeMapper.toStoreResponse(store);
        
        // Fetch and map food items
        List<FoodItem> items = foodItemRepository.findByStoreId(store.getId());
        List<FoodItemResponse> itemResponses = foodItemMapper.toFoodItemResponseList(items);
        response.setFoodItems(itemResponses);

        // Fetch reported closed status (warning if >= 3 reports)
        long reportCount = storeDailyReportRepository.countByStoreIdAndReportDate(store.getId(), LocalDate.now());
        response.setIsReportedClosed(reportCount >= 3);

        return response;
    }

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
}
