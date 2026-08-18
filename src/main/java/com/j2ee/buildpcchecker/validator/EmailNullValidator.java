package com.j2ee.buildpcchecker.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EmailNullValidator implements ConstraintValidator<EmailNullConstraint, String>
{
    @Override
    public boolean isValid(String value, ConstraintValidatorContext constraintValidatorContext) {
        if(value == null || value.isEmpty()) {
            return false;
        }
        return true;
    }

    @Override
    public void initialize(EmailNullConstraint constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
    }
}
