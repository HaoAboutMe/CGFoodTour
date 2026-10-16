package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthAbuseProtectionServiceTest {
    @Test
    void limitsChallengeIssuancePerEmail() {
        AuthAbuseProtectionService service = new AuthAbuseProtectionService();
        for (int i = 0; i < 5; i++) {
            service.checkIssue("user@example.com", "192.0.2." + i);
        }

        assertThatThrownBy(() -> service.checkIssue("user@example.com", "192.0.2.10"))
                .isInstanceOf(AppException.class);
    }
}
