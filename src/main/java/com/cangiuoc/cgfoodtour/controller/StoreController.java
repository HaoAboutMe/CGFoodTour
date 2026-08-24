package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import com.cangiuoc.cgfoodtour.dto.request.RatingRequest;
import com.cangiuoc.cgfoodtour.dto.request.ReportClosedRequest;
import com.cangiuoc.cgfoodtour.dto.request.StoreRequest;
import com.cangiuoc.cgfoodtour.dto.response.StoreResponse;
import com.cangiuoc.cgfoodtour.service.StoreService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/stores")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreController {
    StoreService storeService;

    @PostMapping
    public ApiResponse<StoreResponse> createStore(@RequestBody @Valid StoreRequest request) {
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.createStore(request))
                .message("Store created successfully")
                .build();
    }

    @GetMapping
    public ApiResponse<List<StoreResponse>> getStores(@RequestParam(value = "categoryId", required = false) Integer categoryId) {
        return ApiResponse.<List<StoreResponse>>builder()
                .result(storeService.getStores(categoryId))
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
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.getStore(id))
                .message("Store retrieved successfully")
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<StoreResponse> updateStore(@PathVariable String id, @RequestBody @Valid StoreRequest request) {
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.updateStore(id, request))
                .message("Store updated successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteStore(@PathVariable String id) {
        storeService.deleteStore(id);
        return ApiResponse.<Void>builder()
                .message("Store deleted successfully")
                .build();
    }

    @PostMapping("/{id}/rate")
    public ApiResponse<StoreResponse> rateStore(@PathVariable String id, @RequestBody @Valid RatingRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.rateStore(id, request.getRatingLevel(), email))
                .message("Store rated successfully")
                .build();
    }

    @PostMapping("/{id}/report-closed")
    public ApiResponse<StoreResponse> reportClosed(@PathVariable String id, @RequestBody @Valid ReportClosedRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<StoreResponse>builder()
                .result(storeService.reportClosed(id, request, email))
                .message("Store status reported successfully")
                .build();
    }
}
