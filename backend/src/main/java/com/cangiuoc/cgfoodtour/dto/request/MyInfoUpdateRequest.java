package com.cangiuoc.cgfoodtour.dto.request;

import com.cangiuoc.cgfoodtour.validator.DateOfBirthConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class MyInfoUpdateRequest
{
    @NotBlank(message = "USERNAME_INVALID")
    @Size(min = 3, max = 20, message = "USERNAME_INVALID")
    String username;

    @NotBlank(message = "REQUIRED_FIELD_MISSING")
    @Size(max = 100, message = "INVALID_KEY")
    String firstname;

    @NotBlank(message = "REQUIRED_FIELD_MISSING")
    @Size(max = 100, message = "INVALID_KEY")
    String lastname;

    @DateOfBirthConstraint(min = 18, message = "INVALID_DATE_OF_BIRTH")
    LocalDate dateOfBirth;
}
