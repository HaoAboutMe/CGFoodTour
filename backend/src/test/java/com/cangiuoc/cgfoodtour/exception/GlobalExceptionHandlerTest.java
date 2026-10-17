package com.cangiuoc.cgfoodtour.exception;

import com.cangiuoc.cgfoodtour.dto.request.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void unexpectedRuntimeExceptionReturnsGeneric500() {
        var response = handler.handlingRuntimeException(new RuntimeException("secret internal detail"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody()).isInstanceOf(ApiResponse.class);
        assertThat(response.getBody().getMessage()).isEqualTo("Internal server error");
        assertThat(response.getBody().getMessage()).doesNotContain("secret");
    }

    @Test
    void databaseIntegrityExceptionDoesNotExposeConstraintDetails() {
        var exception = new DataIntegrityViolationException(
                "duplicate", new RuntimeException("Duplicate entry for UK_verification_token_user_id"));

        var response = handler.handlingDataIntegrityViolationException(exception);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody().getCode()).isEqualTo(ErrorCode.DATA_CONFLICT.getCode());
        assertThat(response.getBody().getMessage()).isEqualTo(ErrorCode.DATA_CONFLICT.getMessage());
        assertThat(response.getBody().getMessage()).doesNotContain("UK_verification_token_user_id");
    }
}
