package com.j2ee.buildpcchecker.dto.request;

import com.j2ee.buildpcchecker.validator.DateOfBirthConstraint;
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
    String username;
    String firstname;
    String lastname;

    @DateOfBirthConstraint(min = 18, message = "INVALID_DATE_OF_BIRTH")
    LocalDate dateOfBirth;
}
