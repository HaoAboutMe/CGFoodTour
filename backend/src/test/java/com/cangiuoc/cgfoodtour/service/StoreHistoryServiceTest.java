package com.cangiuoc.cgfoodtour.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cangiuoc.cgfoodtour.dto.response.PageResponse;
import com.cangiuoc.cgfoodtour.dto.response.OwnerStoreHistoryItemResponse;
import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.entity.StoreAuditLog;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.repository.StoreAuditLogRepository;
import com.cangiuoc.cgfoodtour.repository.StoreRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreHistoryServiceTest {
    @Mock StoreAuditLogRepository storeAuditLogRepository;
    @Mock StoreRepository storeRepository;
    @Mock UserRepository userRepository;
    @InjectMocks StoreHistoryService storeHistoryService;

    @Test
    void returnsOwnerSafeTimelineAndOnlyAssignsOneCurrentActionPerStore() {
        User owner = User.builder().id("owner-1").email("owner@example.com").build();
        Store store = Store.builder()
                .id("store-1")
                .owner(owner)
                .status(StoreStatus.REJECTED)
                .build();
        StoreAuditLog rejected = log(2L, "REJECT", "ADMIN", "Missing address", LocalDateTime.of(2026, 10, 24, 10, 0));
        StoreAuditLog submitted = log(1L, "SUBMIT", "OWNER", "must-not-leak", LocalDateTime.of(2026, 10, 24, 9, 0));

        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(storeAuditLogRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(rejected, submitted), PageRequest.of(0, 20), 2));
        when(storeRepository.findAllById(any())).thenReturn(List.of(store));

        PageResponse<OwnerStoreHistoryItemResponse> result = storeHistoryService.getMyHistory(
                owner.getEmail(), 0, 20, null, "ALL", null, null, null);

        assertEquals(2, result.getTotalElements());
        assertEquals("ADMIN", result.getContent().get(0).getActorType());
        assertEquals("Missing address", result.getContent().get(0).getReason());
        assertEquals("EDIT_AND_RESUBMIT", result.getContent().get(0).getRecommendedAction());
        assertNull(result.getContent().get(1).getReason());
        assertEquals("NONE", result.getContent().get(1).getRecommendedAction());
        assertTrue(result.getContent().get(0).getResourceAvailable());
    }

    @Test
    void hidesReasonAndActorIdentityForUnknownLegacyActionAndMarksDeletedResource() {
        StoreAuditLog unknown = log(3L, "INTERNAL_REVIEW_NOTE", "SUPER_ADMIN", "private note",
                LocalDateTime.of(2026, 10, 24, 11, 0));

        OwnerStoreHistoryItemResponse response = storeHistoryService.toOwnerResponse(
                unknown, null, new java.util.LinkedHashMap<>());

        assertEquals("SYSTEM", response.getActorType());
        assertNull(response.getReason());
        assertFalse(response.getResourceAvailable());
        assertEquals("NONE", response.getRecommendedAction());
    }

    @Test
    void onlyExposesHardDeleteReasonWhenAdminPerformedTheDeletion() {
        StoreAuditLog ownerDeletion = log(4L, "HARD_DELETE", "OWNER", "private owner note",
                LocalDateTime.of(2026, 10, 24, 12, 0));
        StoreAuditLog adminDeletion = log(5L, "HARD_DELETE", "ADMIN", "Vi phạm nội dung",
                LocalDateTime.of(2026, 10, 24, 13, 0));

        OwnerStoreHistoryItemResponse ownerResponse = storeHistoryService.toOwnerResponse(
                ownerDeletion, null, new java.util.LinkedHashMap<>());
        OwnerStoreHistoryItemResponse adminResponse = storeHistoryService.toOwnerResponse(
                adminDeletion, null, new java.util.LinkedHashMap<>());

        assertNull(ownerResponse.getReason());
        assertEquals("Vi phạm nội dung", adminResponse.getReason());
    }

    @Test
    void ownerResponseJsonContractDoesNotContainActorPersonallyIdentifiableInformation() throws Exception {
        StoreAuditLog auditLog = log(6L, "REJECT", "ADMIN", "Thiếu địa chỉ",
                LocalDateTime.of(2026, 10, 24, 14, 0));

        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(storeHistoryService.toOwnerResponse(
                auditLog, null, new java.util.LinkedHashMap<>()));

        assertFalse(json.contains("actorId"));
        assertFalse(json.contains("actorEmail"));
        assertFalse(json.contains("sensitive-actor-id"));
        assertFalse(json.contains("sensitive@example.com"));
    }

    @Test
    void rejectsInvalidDateRangeBeforeQueryingAudit() {
        User owner = User.builder().id("owner-1").email("owner@example.com").build();
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        AppException exception = assertThrows(AppException.class, () -> storeHistoryService.getMyHistory(
                owner.getEmail(), 0, 20, null, "ALL", null,
                OffsetDateTime.parse("2026-10-25T00:00:00+07:00"),
                OffsetDateTime.parse("2026-10-24T23:59:59+07:00")));

        assertEquals(ErrorCode.INVALID_PAGE_REQUEST, exception.getErrorCode());
    }

    private StoreAuditLog log(Long id, String action, String actorRole, String reason, LocalDateTime createdAt) {
        return StoreAuditLog.builder()
                .id(id)
                .storeId("store-1")
                .storeName("Bánh xèo Bà Mười")
                .ownerIdSnapshot("owner-1")
                .actorId("sensitive-actor-id")
                .actorEmail("sensitive@example.com")
                .actorRole(actorRole)
                .actionType(action)
                .reason(reason)
                .statusBefore("PENDING")
                .statusAfter("REJECTED")
                .ownerVisible(true)
                .createdAt(createdAt)
                .build();
    }
}
