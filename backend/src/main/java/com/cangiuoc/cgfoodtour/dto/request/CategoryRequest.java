package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryRequest {
    @NotBlank(message = "CATEGORY_NAME_BLANK")
    @Size(min = 2, max = 50, message = "CATEGORY_NAME_INVALID")
    String name;
    String iconUrl;
}
