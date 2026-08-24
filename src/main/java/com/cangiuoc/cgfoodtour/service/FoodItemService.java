package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.FoodItemRequest;
import com.cangiuoc.cgfoodtour.dto.response.FoodItemResponse;
import com.cangiuoc.cgfoodtour.entity.FoodItem;
import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.mapper.FoodItemMapper;
import com.cangiuoc.cgfoodtour.repository.FoodItemRepository;
import com.cangiuoc.cgfoodtour.repository.StoreRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FoodItemService {
    FoodItemRepository foodItemRepository;
    StoreRepository storeRepository;
    FoodItemMapper foodItemMapper;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public FoodItemResponse createFoodItem(String storeId, FoodItemRequest request) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));
        FoodItem foodItem = foodItemMapper.toFoodItem(request);
        foodItem.setStore(store);
        return foodItemMapper.toFoodItemResponse(foodItemRepository.save(foodItem));
    }

    public List<FoodItemResponse> getFoodItemsByStore(String storeId) {
        if (!storeRepository.existsById(storeId)) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }
        return foodItemMapper.toFoodItemResponseList(foodItemRepository.findByStoreId(storeId));
    }

    public FoodItemResponse getFoodItem(Long id) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FOOD_ITEM_NOT_FOUND));
        return foodItemMapper.toFoodItemResponse(foodItem);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public FoodItemResponse updateFoodItem(Long id, FoodItemRequest request) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FOOD_ITEM_NOT_FOUND));
        foodItemMapper.updateFoodItem(foodItem, request);
        return foodItemMapper.toFoodItemResponse(foodItemRepository.save(foodItem));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteFoodItem(Long id) {
        if (!foodItemRepository.existsById(id)) {
            throw new AppException(ErrorCode.FOOD_ITEM_NOT_FOUND);
        }
        foodItemRepository.deleteById(id);
    }
}
