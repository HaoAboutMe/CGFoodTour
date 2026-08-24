package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreRequest {
    @NotNull(message = "Category ID is required")
    Integer categoryId;

    @NotBlank(message = "Store name cannot be blank")
    String name;

    String phoneNumber;

    @NotBlank(message = "Address line is required")
    String addressLine;

    @NotBlank(message = "Landmark note is required")
    String landmarkNote;

    Double latitude;
    Double longitude;

    @NotNull(message = "Open time is required")
    LocalTime openTime;

    @NotNull(message = "Close time is required")
    LocalTime closeTime;

    @Builder.Default
    Double priceMin = 0.0;

    @Builder.Default
    Double priceMax = 0.0;

    String bannerImageUrl;

    @Builder.Default
    Boolean isVerified = true;
}
