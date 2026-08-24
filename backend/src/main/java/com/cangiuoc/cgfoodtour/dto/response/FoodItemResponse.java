package com.cangiuoc.cgfoodtour.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FoodItemResponse {
    Long id;
    String storeId;
    String name;
    Double price;
    String imageUrl;
    String description;
    Boolean isSignature;
    LocalDateTime createdAt;
}
