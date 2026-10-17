package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.FoodItem;
import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.mapper.FoodItemMapper;
import com.cangiuoc.cgfoodtour.repository.FoodItemRepository;
import com.cangiuoc.cgfoodtour.repository.StoreRepository;
import com.cangiuoc.cgfoodtour.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FoodItemVisibilityTest {
    @Mock FoodItemRepository foodItemRepository;
    @Mock StoreRepository storeRepository;
    @Mock UserRepository userRepository;
    @Mock FoodItemMapper foodItemMapper;
    @Spy StoreVisibilityPolicy storeVisibilityPolicy = new StoreVisibilityPolicy();
    @InjectMocks FoodItemService foodItemService;

    @Test
    void anonymousCannotListItemsOfPendingStore() {
        Store pending = Store.builder().id("pending-store").status(StoreStatus.PENDING).build();
        when(storeRepository.findById("pending-store")).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> foodItemService.getFoodItemsByStore("pending-store", null))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.STORE_NOT_FOUND));
    }

    @Test
    void anonymousCannotReadItemOfHiddenStore() {
        Store hidden = Store.builder().id("hidden-store").status(StoreStatus.HIDDEN).build();
        FoodItem item = FoodItem.builder().id(1L).store(hidden).build();
        when(foodItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> foodItemService.getFoodItem(1L, null))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FOOD_ITEM_NOT_FOUND));
    }
}
