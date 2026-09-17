package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import com.cangiuoc.cgfoodtour.dto.request.CategoryRequest;
import com.cangiuoc.cgfoodtour.dto.response.CategoryResponse;
import com.cangiuoc.cgfoodtour.service.CategoryService;
import com.cangiuoc.cgfoodtour.service.SseNotificationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryController {
    CategoryService categoryService;
    SseNotificationService sseNotificationService;

    @PostMapping
    public ApiResponse<CategoryResponse> createCategory(@RequestBody @Valid CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<CategoryResponse>builder()
                .result(response)
                .message("Category created successfully")
                .build();
    }

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categoryService.getCategories())
                .message("Categories retrieved successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getCategory(@PathVariable Integer id) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.getCategory(id))
                .message("Category retrieved successfully")
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> updateCategory(@PathVariable Integer id, @RequestBody @Valid CategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<CategoryResponse>builder()
                .result(response)
                .message("Category updated successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        sseNotificationService.broadcast("STORES_UPDATED");
        return ApiResponse.<Void>builder()
                .message("Category deleted successfully")
                .build();
    }
}

