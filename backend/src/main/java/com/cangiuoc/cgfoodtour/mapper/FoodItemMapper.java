package com.cangiuoc.cgfoodtour.mapper;

import com.cangiuoc.cgfoodtour.dto.request.FoodItemRequest;
import com.cangiuoc.cgfoodtour.dto.response.FoodItemResponse;
import com.cangiuoc.cgfoodtour.entity.FoodItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FoodItemMapper {
    @Mapping(target = "store", ignore = true)
    FoodItem toFoodItem(FoodItemRequest request);

    @Mapping(target = "storeId", source = "store.id")
    FoodItemResponse toFoodItemResponse(FoodItem foodItem);

    List<FoodItemResponse> toFoodItemResponseList(List<FoodItem> foodItems);

    @Mapping(target = "store", ignore = true)
    void updateFoodItem(@MappingTarget FoodItem foodItem, FoodItemRequest request);
}
