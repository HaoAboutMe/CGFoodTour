package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.dto.request.FoodItemRequest;
import com.cangiuoc.cgfoodtour.dto.response.FoodItemResponse;
import com.cangiuoc.cgfoodtour.entity.FoodItem;
import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.mapper.FoodItemMapper;
import com.cangiuoc.cgfoodtour.repository.FoodItemRepository;
import com.cangiuoc.cgfoodtour.repository.StoreRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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
    UserRepository userRepository;
    FoodItemMapper foodItemMapper;

    private boolean isAdmin(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()));
    }

    @Transactional
    public FoodItemResponse createFoodItem(String storeId, FoodItemRequest request, String email) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_FOUND));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

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

    @Transactional
    public FoodItemResponse updateFoodItem(Long id, FoodItemRequest request, String email) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FOOD_ITEM_NOT_FOUND));

        Store store = foodItem.getStore();
        if (store == null) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        foodItemMapper.updateFoodItem(foodItem, request);
        return foodItemMapper.toFoodItemResponse(foodItemRepository.save(foodItem));
    }

    @Transactional
    public void deleteFoodItem(Long id, String email) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FOOD_ITEM_NOT_FOUND));

        Store store = foodItem.getStore();
        if (store == null) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean userIsAdmin = isAdmin(user);
        boolean isOwner = store.getOwner() != null && user.getId().equals(store.getOwner().getId());

        if (!userIsAdmin && !isOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        foodItemRepository.deleteById(id);
    }
}
