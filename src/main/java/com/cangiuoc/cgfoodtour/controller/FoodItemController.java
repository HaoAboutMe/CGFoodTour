package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import com.cangiuoc.cgfoodtour.dto.request.FoodItemRequest;
import com.cangiuoc.cgfoodtour.dto.response.FoodItemResponse;
import com.cangiuoc.cgfoodtour.service.FoodItemService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/food-items")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FoodItemController {
    FoodItemService foodItemService;

    @PostMapping("/store/{storeId}")
    public ApiResponse<FoodItemResponse> createFoodItem(@PathVariable String storeId, @RequestBody @Valid FoodItemRequest request) {
        return ApiResponse.<FoodItemResponse>builder()
                .result(foodItemService.createFoodItem(storeId, request))
                .message("Food item created successfully")
                .build();
    }

    @GetMapping("/store/{storeId}")
    public ApiResponse<List<FoodItemResponse>> getFoodItemsByStore(@PathVariable String storeId) {
        return ApiResponse.<List<FoodItemResponse>>builder()
                .result(foodItemService.getFoodItemsByStore(storeId))
                .message("Food items retrieved successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<FoodItemResponse> getFoodItem(@PathVariable Long id) {
        return ApiResponse.<FoodItemResponse>builder()
                .result(foodItemService.getFoodItem(id))
                .message("Food item retrieved successfully")
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<FoodItemResponse> updateFoodItem(@PathVariable Long id, @RequestBody @Valid FoodItemRequest request) {
        return ApiResponse.<FoodItemResponse>builder()
                .result(foodItemService.updateFoodItem(id, request))
                .message("Food item updated successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteFoodItem(@PathVariable Long id) {
        foodItemService.deleteFoodItem(id);
        return ApiResponse.<Void>builder()
                .message("Food item deleted successfully")
                .build();
    }
}
