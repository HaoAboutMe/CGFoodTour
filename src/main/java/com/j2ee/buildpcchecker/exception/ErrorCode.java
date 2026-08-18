package com.j2ee.buildpcchecker.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User already exists", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at {min} charactors", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "Password must be at least {min} charactors", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1005, "Email is not valid", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1006, "User not exist", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1007, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1008, "You don't have permission", HttpStatus.FORBIDDEN),
    INVALID_DATE_OF_BIRTH(1009, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    INVALID_VERIFICATION_TOKEN(1010, "Invalid or expired verification token", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_VERIFIED(1011, "Email is not verified. Please verify your email first", HttpStatus.FORBIDDEN),
    EMAIL_ALREADY_VERIFIED(1012, "Email is already verified", HttpStatus.BAD_REQUEST),
    ACCOUNT_DISABLED(1013, "Account is disabled", HttpStatus.FORBIDDEN),
    INVALID_OTP(1014, "Invalid or expired OTP", HttpStatus.BAD_REQUEST),
    EMAIL_SEND_FAILED(1015, "Failed to send email. Please check SMTP/mail server settings.", HttpStatus.INTERNAL_SERVER_ERROR),
    GOOGLE_TOKEN_INVALID(1016, "Google ID token is invalid or expired", HttpStatus.BAD_REQUEST),
    PASSWORD_INCORRECT(1017, "Incorrect password", HttpStatus.BAD_REQUEST);

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode statusCode;

}
