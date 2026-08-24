package com.cangiuoc.cgfoodtour.dto.request;

import com.cangiuoc.cgfoodtour.enums.RatingLevel;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingRequest {
    @NotNull(message = "Rating level is required")
    RatingLevel ratingLevel;
}
