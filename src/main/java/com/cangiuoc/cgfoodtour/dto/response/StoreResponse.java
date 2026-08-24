package com.cangiuoc.cgfoodtour.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreResponse {
    String id;
    Integer categoryId;
    String categoryName;
    String name;
    String phoneNumber;
    String addressLine;
    String landmarkNote;
    Double latitude;
    Double longitude;
    LocalTime openTime;
    LocalTime closeTime;
    Double priceMin;
    Double priceMax;
    String bannerImageUrl;
    Boolean isVerified;

    // Counters
    Integer countVerySatisfied;
    Integer countNormal;
    Integer countNotSatisfied;
    Integer totalVotes;
    Double satisfactionRate;

    // List of food items
    List<FoodItemResponse> foodItems;

    // Status warning
    Boolean isReportedClosed;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
