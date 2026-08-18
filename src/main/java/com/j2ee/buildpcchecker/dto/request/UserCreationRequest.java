package com.j2ee.buildpcchecker.dto.request;

import com.j2ee.buildpcchecker.validator.DateOfBirthConstraint;
import com.j2ee.buildpcchecker.validator.EmailNullConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest
{
    //Message truyền theo key nằm trong ErrorCode enum
    @Size(min = 3, message = "USERNAME_INVALID")
    String username;
    String firstname;
    String lastname;

    @Email(message = "EMAIL_INVALID")
    @EmailNullConstraint(message = "EMAIL_INVALID")
    String email;

    @Size(min = 8, message = "PASSWORD_INVALID")
    String password;

    @DateOfBirthConstraint(min = 5, message = "INVALID_DATE_OF_BIRTH")
    LocalDate dateOfBirth;
}
