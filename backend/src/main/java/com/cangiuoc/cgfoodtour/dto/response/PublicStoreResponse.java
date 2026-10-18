package com.cangiuoc.cgfoodtour.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PublicStoreResponse {
    String id;
    Integer categoryId;
    String categoryName;
    String name;
    String phoneNumber;
    String addressLine;
    String landmarkNote;
    Double latitude;
    Double longitude;
    String mapUrl;
    LocalTime openTime;
    LocalTime closeTime;
    Double priceMin;
    Double priceMax;
    String bannerImageUrl;
    Boolean isVerified;
    String status;
    Integer countVerySatisfied;
    Integer countNormal;
    Integer countNotSatisfied;
    Integer totalVotes;
    Double satisfactionRate;
    Integer savedCount;
    Boolean isSaved;
    List<FoodItemResponse> foodItems;
    Boolean isReportedClosed;
    Double distanceKm;
    Boolean openNow;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
