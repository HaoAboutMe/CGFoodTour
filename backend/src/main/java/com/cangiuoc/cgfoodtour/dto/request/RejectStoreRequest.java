package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RejectStoreRequest {
    @NotBlank(message = "Rejection reason is required")
    String reason;
}
