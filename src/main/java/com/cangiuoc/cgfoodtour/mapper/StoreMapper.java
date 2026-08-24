package com.cangiuoc.cgfoodtour.mapper;

import com.cangiuoc.cgfoodtour.dto.request.StoreRequest;
import com.cangiuoc.cgfoodtour.dto.response.StoreResponse;
import com.cangiuoc.cgfoodtour.entity.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StoreMapper {
    @Mapping(target = "category", ignore = true)
    Store toStore(StoreRequest request);

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerEmail", source = "owner.email")
    @Mapping(target = "foodItems", ignore = true)
    @Mapping(target = "isReportedClosed", ignore = true)
    StoreResponse toStoreResponse(Store store);

    List<StoreResponse> toStoreResponseList(List<Store> stores);

    @Mapping(target = "category", ignore = true)
    void updateStore(@MappingTarget Store store, StoreRequest request);
}
