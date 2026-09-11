package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import com.cangiuoc.cgfoodtour.dto.request.RatingRequest;
import com.cangiuoc.cgfoodtour.dto.request.ReportClosedRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreActionRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreRequest;
import com.cangiuoc.cgfoodtour.dto.request.RejectStoreRequest;
import com.cangiuoc.cgfoodtour.dto.response.StoreResponse;
import com.cangiuoc.cgfoodtour.service.StoreService;
import com.cangiuoc.cgfoodtour.service.SseNotificationService;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/stores")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreController {
    StoreService storeService;
    SseNotificationService sseNotificationService;

    private String getCurrentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return null;
    }

    @GetMapping("/events")
    public SseEmitter subscribeToStoreEvents() {
        return sseNotificationService.subscribe();
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> createStore(@RequestBody @Valid StoreRequest request) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.createStore(request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store submitted successfully and is pending approval")
                .build();
    }

    @GetMapping
    public ApiResponse<List<StoreResponse>> getStores(@RequestParam(value = "categoryId", required = false) Integer categoryId) {
        String email = getCurrentUserEmail();
        return ApiResponse.<List<StoreResponse>>builder()
                .result(storeService.getStores(categoryId, email))
                .message("Stores retrieved successfully")
                .build();
    }

    @GetMapping("/ranking")
    public ApiResponse<List<StoreResponse>> getRanking() {
        return ApiResponse.<List<StoreResponse>>builder()
                .result(storeService.getRanking())
                .message("Ranking retrieved successfully")
                .build();
    }

    @GetMapping("/random")
    public ApiResponse<StoreResponse> getRandomStore(@RequestParam(value = "categoryId", required = false) Integer categoryId) {
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.getRandomStore(categoryId))
                .message("Random store selected successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<StoreResponse> getStore(@PathVariable String id) {
        String email = getCurrentUserEmail();
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.getStore(id, email))
                .message("Store retrieved successfully")
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> updateStore(@PathVariable String id, @RequestBody @Valid StoreRequest request) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.updateStore(id, request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store updated successfully and is pending approval")
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteStore(@PathVariable String id, @RequestBody(required = false) StoreActionRequest request) {
        String email = getCurrentUserEmail();
        storeService.hardDeleteStore(id, request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<Void>builder()
                .message("Store deleted successfully")
                .build();
    }

    @PostMapping("/{id}/hide")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> hideStore(@PathVariable String id, @RequestBody(required = false) StoreActionRequest request) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.hideStore(id, request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store hidden successfully")
                .build();
    }

    @PostMapping("/{id}/recover")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> recoverStore(@PathVariable String id, @RequestBody(required = false) StoreActionRequest request) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.recoverStore(id, request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store recovered successfully")
                .build();
    }

    @PostMapping("/{id}/request-recovery")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> requestStoreRecovery(@PathVariable String id, @RequestBody @Valid StoreActionRequest request) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.requestStoreRecovery(id, request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Recovery request submitted successfully")
                .build();
    }

    @PostMapping("/{id}/reject-recovery-request")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StoreResponse> rejectRecoveryRequest(@PathVariable String id, @RequestBody @Valid StoreActionRequest request) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.rejectRecoveryRequest(id, request, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Recovery request rejected successfully")
                .build();
    }

    @PostMapping("/{id}/rate")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> rateStore(@PathVariable String id, @RequestBody @Valid RatingRequest request) {
        String email = getCurrentUserEmail();
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.rateStore(id, request.getRatingLevel(), email))
                .message("Store rated successfully")
                .build();
    }

    @PostMapping("/{id}/report-closed")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> reportClosed(@PathVariable String id, @RequestBody @Valid ReportClosedRequest request) {
        String email = getCurrentUserEmail();
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.reportClosed(id, request, email))
                .message("Store status reported successfully")
                .build();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StoreResponse> approveStore(@PathVariable String id) {
        StoreResponse response = storeService.approveStore(id);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store approved successfully")
                .build();
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StoreResponse> rejectStore(@PathVariable String id, @RequestBody @Valid RejectStoreRequest request) {
        StoreResponse response = storeService.rejectStore(id, request.getReason());
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store rejected successfully")
                .build();
    }
}
