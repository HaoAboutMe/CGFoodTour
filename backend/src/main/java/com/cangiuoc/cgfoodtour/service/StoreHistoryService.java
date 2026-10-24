package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.response.OwnerStoreHistoryItemResponse;
import com.cangiuoc.cgfoodtour.dto.response.PageResponse;
import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.entity.StoreAuditLog;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.enums.OwnerStoreHistoryGroup;
import com.cangiuoc.cgfoodtour.enums.StoreAction;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.repository.StoreAuditLogRepository;
import com.cangiuoc.cgfoodtour.repository.StoreRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreHistoryService {
    static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final Set<String> OWNER_VISIBLE_REASONS = Set.of(
            StoreAction.REJECT.name(),
            StoreAction.HIDE.name(),
            StoreAction.RECOVER.name(),
            StoreAction.REQUEST_RECOVERY.name(),
            StoreAction.REJECT_RECOVERY_REQUEST.name(),
            StoreAction.HARD_DELETE.name()
    );

    StoreAuditLogRepository storeAuditLogRepository;
    StoreRepository storeRepository;
    UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<OwnerStoreHistoryItemResponse> getMyHistory(
            String email,
            int page,
            int size,
            String storeId,
            String group,
            String query,
            OffsetDateTime from,
            OffsetDateTime to) {
        if (page < 0 || size < 1 || size > 50) {
            throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        }

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        OwnerStoreHistoryGroup parsedGroup = parseGroup(group);
        String normalizedStoreId = normalizeOptional(storeId, 255);
        String normalizedQuery = normalizeOptional(query, 100);
        LocalDateTime fromLocal = toLocalDateTime(from);
        LocalDateTime toLocal = toLocalDateTime(to);
        if (fromLocal != null && toLocal != null && toLocal.isBefore(fromLocal)) {
            throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        }

        Specification<StoreAuditLog> specification = (root, criteriaQuery, cb) -> cb.and(
                cb.equal(root.get("ownerIdSnapshot"), owner.getId()),
                cb.isTrue(root.get("ownerVisible"))
        );

        if (normalizedStoreId != null) {
            specification = specification.and((root, criteriaQuery, cb) ->
                    cb.equal(root.get("storeId"), normalizedStoreId));
        }
        if (normalizedQuery != null) {
            String pattern = "%" + escapeLike(normalizedQuery.toLowerCase(Locale.ROOT)) + "%";
            specification = specification.and((root, criteriaQuery, cb) ->
                    cb.like(cb.lower(root.get("storeName")), pattern, '\\'));
        }
        if (fromLocal != null) {
            specification = specification.and((root, criteriaQuery, cb) ->
                    cb.greaterThanOrEqualTo(root.get("createdAt"), fromLocal));
        }
        if (toLocal != null) {
            specification = specification.and((root, criteriaQuery, cb) ->
                    cb.lessThanOrEqualTo(root.get("createdAt"), toLocal));
        }
        if (parsedGroup != OwnerStoreHistoryGroup.ALL) {
            Set<String> actionNames = parsedGroup.actions().stream()
                    .map(Enum::name)
                    .collect(Collectors.toSet());
            specification = specification.and((root, criteriaQuery, cb) ->
                    root.get("actionType").in(actionNames));
        }

        PageRequest pageRequest = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt")
                        .and(Sort.by(Sort.Direction.DESC, "id")));
        Page<StoreAuditLog> auditPage = storeAuditLogRepository.findAll(specification, pageRequest);

        Set<String> storeIds = auditPage.getContent().stream()
                .map(StoreAuditLog::getStoreId)
                .collect(Collectors.toSet());
        Map<String, Store> currentStores = storeRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(Store::getId, store -> store));
        Map<String, Boolean> actionAssigned = new LinkedHashMap<>();

        List<OwnerStoreHistoryItemResponse> content = auditPage.getContent().stream()
                .map(log -> toOwnerResponse(log, currentStores.get(log.getStoreId()), actionAssigned))
                .toList();
        return PageResponse.from(auditPage, content);
    }

    OwnerStoreHistoryItemResponse toOwnerResponse(
            StoreAuditLog log,
            Store currentStore,
            Map<String, Boolean> actionAssigned) {
        boolean resourceAvailable = currentStore != null;
        boolean mayRecommend = resourceAvailable
                && actionAssigned.putIfAbsent(log.getStoreId(), Boolean.TRUE) == null;
        String recommendedAction = mayRecommend ? recommendedAction(currentStore) : "NONE";

        return OwnerStoreHistoryItemResponse.builder()
                .eventId(log.getId())
                .storeId(log.getStoreId())
                .storeName(log.getStoreName())
                .action(log.getActionType())
                .actorType(safeActorType(log.getActorRole()))
                .statusBefore(log.getStatusBefore())
                .statusAfter(log.getStatusAfter())
                .reason(ownerVisibleReason(log))
                .occurredAt(log.getCreatedAt() == null
                        ? null
                        : log.getCreatedAt().atZone(APP_ZONE).toOffsetDateTime())
                .resourceAvailable(resourceAvailable)
                .recommendedAction(recommendedAction)
                .build();
    }

    private OwnerStoreHistoryGroup parseGroup(String group) {
        if (group == null || group.isBlank()) return OwnerStoreHistoryGroup.ALL;
        try {
            return OwnerStoreHistoryGroup.valueOf(group.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        }
    }

    private String ownerVisibleReason(StoreAuditLog log) {
        if (log.getActionType() == null || !OWNER_VISIBLE_REASONS.contains(log.getActionType())) {
            return null;
        }
        if (StoreAction.HARD_DELETE.name().equals(log.getActionType())
                && !"ADMIN".equalsIgnoreCase(log.getActorRole())) {
            return null;
        }
        if (log.getReason() == null || log.getReason().isBlank()) return null;
        return log.getReason().trim();
    }

    private String safeActorType(String actorRole) {
        if ("ADMIN".equalsIgnoreCase(actorRole)) return "ADMIN";
        if ("OWNER".equalsIgnoreCase(actorRole)) return "OWNER";
        return "SYSTEM";
    }

    private String recommendedAction(Store store) {
        if (store.getStatus() == StoreStatus.REJECTED) return "EDIT_AND_RESUBMIT";
        if (store.getStatus() == StoreStatus.HIDDEN
                && Boolean.TRUE.equals(store.getHiddenByAdmin())
                && !Boolean.TRUE.equals(store.getRecoveryRequested())) {
            return "REQUEST_RECOVERY";
        }
        return "VIEW";
    }

    private LocalDateTime toLocalDateTime(OffsetDateTime value) {
        return value == null ? null : LocalDateTime.ofInstant(value.toInstant(), APP_ZONE);
    }

    private String normalizeOptional(String value, int maxLength) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) throw new AppException(ErrorCode.INVALID_PAGE_REQUEST);
        return normalized;
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
