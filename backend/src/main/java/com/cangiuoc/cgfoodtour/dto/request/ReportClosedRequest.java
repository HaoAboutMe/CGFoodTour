package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReportClosedRequest {
    @NotNull(message = "Latitude is required for geo-fencing check")
    Double latitude;

    @NotNull(message = "Longitude is required for geo-fencing check")
    Double longitude;
}
