package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import com.cangiuoc.cgfoodtour.dto.request.RatingRequest;
import com.cangiuoc.cgfoodtour.dto.request.ReportClosedRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreActionRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreRequest;
import com.cangiuoc.cgfoodtour.dto.request.RejectStoreRequest;
import com.cangiuoc.cgfoodtour.dto.response.StoreResponse;
import com.cangiuoc.cgfoodtour.dto.response.PublicStoreResponse;
import com.cangiuoc.cgfoodtour.dto.response.PageResponse;
import com.cangiuoc.cgfoodtour.service.StoreService;
import com.cangiuoc.cgfoodtour.service.SseNotificationService;
import com.cangiuoc.cgfoodtour.service.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/stores")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreController {
    StoreService storeService;
    SseNotificationService sseNotificationService;
    ClientIpResolver clientIpResolver;

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

    @GetMapping("/parse-gmaps")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, String>> parseGmapsUrl(@RequestParam("url") String url,
                                                          HttpServletRequest request) {
        return ApiResponse.<Map<String, String>>builder()
                .result(storeService.parseGoogleMapsUrl(url, getCurrentUserEmail(), clientIpResolver.resolve(request)))
                .message("Parsed Google Maps URL")
                .build();
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
    public ApiResponse<PageResponse<PublicStoreResponse>> getStores(
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "sort", defaultValue = "newest") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "24") int size) {
        String email = getCurrentUserEmail();
        return ApiResponse.<PageResponse<PublicStoreResponse>>builder()
                .result(storeService.getStores(categoryId, query, sort, page, size, email))
                .message("Stores retrieved successfully")
                .build();
    }

    @GetMapping("/ranking")
    public ApiResponse<List<PublicStoreResponse>> getRanking(
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        String email = getCurrentUserEmail();
        return ApiResponse.<List<PublicStoreResponse>>builder()
                .result(storeService.getRanking(email, limit))
                .message("Ranking retrieved successfully")
                .build();
    }

    @GetMapping("/random")
    public ApiResponse<PublicStoreResponse> getRandomStore(@RequestParam(value = "categoryId", required = false) Integer categoryId) {
        String email = getCurrentUserEmail();
        return ApiResponse.<PublicStoreResponse>builder()
                .result(storeService.getRandomStore(categoryId, email))
                .message("Random store selected successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<PublicStoreResponse> getStore(@PathVariable String id) {
        String email = getCurrentUserEmail();
        return ApiResponse.<PublicStoreResponse>builder()
                .result(storeService.getStore(id, email))
                .message("Store retrieved successfully")
                .build();
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<StoreResponse>> getMyStores(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "sort", defaultValue = "newest") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        String email = getCurrentUserEmail();
        return ApiResponse.<PageResponse<StoreResponse>>builder()
                .result(storeService.getMyStores(email, status, sort, page, size))
                .message("Owned stores retrieved successfully")
                .build();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<StoreResponse>> getAdminStores(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "sort", defaultValue = "newest") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        String email = getCurrentUserEmail();
        return ApiResponse.<PageResponse<StoreResponse>>builder()
                .result(storeService.getAdminStores(email, status, categoryId, query, sort, page, size))
                .message("Administrative stores retrieved successfully")
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
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

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> updateStoreWithBanner(
            @PathVariable String id,
            @RequestPart("store") @Valid StoreRequest request,
            @RequestPart(value = "banner", required = false) MultipartFile banner) {
        String email = getCurrentUserEmail();
        StoreResponse response = storeService.updateStore(id, request, banner, email);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store updated successfully and is pending approval")
                .build();
    }

    @PatchMapping(value = "/{id}/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<StoreResponse> updateStoreBanner(@PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        StoreResponse response = storeService.updateStoreBanner(id, file, getCurrentUserEmail());
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<StoreResponse>builder()
                .result(response)
                .message("Store banner updated successfully")
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

    @PostMapping("/{id}/save")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PublicStoreResponse> toggleSaveStore(@PathVariable String id) {
        String email = getCurrentUserEmail();
        PublicStoreResponse response = storeService.toggleSaveStore(id, email);
        return ApiResponse.<PublicStoreResponse>builder()
                .result(response)
                .message(Boolean.TRUE.equals(response.getIsSaved()) ? "Đã lưu quán ăn" : "Đã bỏ lưu quán ăn")
                .build();
    }

    @GetMapping("/saved")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<PublicStoreResponse>> getSavedStores(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "24") int size) {
        String email = getCurrentUserEmail();
        PageResponse<PublicStoreResponse> responses = storeService.getSavedStoresForUser(email, page, size);
        return ApiResponse.<PageResponse<PublicStoreResponse>>builder()
                .result(responses)
                .message("Fetched saved stores successfully")
                .build();
    }
}
