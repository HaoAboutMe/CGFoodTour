package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FoodItemRequest {
    @NotBlank(message = "Food name cannot be blank")
    String name;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be positive or zero")
    Double price;

    String imageUrl;
    String description;
    
    @Builder.Default
    Boolean isSignature = false;
}
