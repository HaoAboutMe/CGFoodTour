package com.j2ee.buildpcchecker.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({ FIELD })
@Retention(RUNTIME)
@Constraint(
        validatedBy = { EmailNullValidator.class }
)
public @interface EmailNullConstraint
{
    String message() default "Email cannot be null";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
