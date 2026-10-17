package com.cangiuoc.cgfoodtour.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminDeleteUserRequest {
    @NotBlank(message = "ACCOUNT_ACTION_REASON_REQUIRED")
    @Size(max = 1000, message = "ACCOUNT_ACTION_REASON_REQUIRED")
    private String reason;
    @NotBlank(message = "DELETE_CONFIRMATION_INVALID")
    private String confirmation;
}
