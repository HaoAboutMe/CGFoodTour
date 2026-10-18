package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthCookieServiceTest {
    private AuthCookieService service;

    @BeforeEach
    void setUp() {
        service = new AuthCookieService();
        ReflectionTestUtils.setField(service, "refreshCookieName", "__Host-cgft_refresh");
        ReflectionTestUtils.setField(service, "csrfCookieName", "__Host-cgft_csrf");
        ReflectionTestUtils.setField(service, "secure", true);
        ReflectionTestUtils.setField(service, "sameSite", "Strict");
        ReflectionTestUtils.setField(service, "refreshDuration", 3600L);
        ReflectionTestUtils.setField(service, "allowedOrigins", "https://food.example");
        ReflectionTestUtils.setField(service, "includeLocalOrigins", false);
    }

    @Test
    void sessionCookiesUseHardenedAttributesAndKeepCsrfReadable() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        service.writeSessionCookies(response, "refresh-token");

        assertThat(response.getHeaders("Set-Cookie"))
                .anySatisfy(value -> assertThat(value)
                        .contains("__Host-cgft_refresh=refresh-token", "HttpOnly", "Secure", "SameSite=Strict", "Path=/"))
                .anySatisfy(value -> assertThat(value)
                        .contains("__Host-cgft_csrf=", "Secure", "SameSite=Strict", "Path=/")
                        .doesNotContain("HttpOnly"));
    }

    @Test
    void csrfRequiresMatchingCookieHeaderAndAllowedOrigin() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("__Host-cgft_csrf", "same-token"));
        request.addHeader("X-CSRF-Token", "same-token");
        request.addHeader("Origin", "https://food.example");
        service.requireValidCsrf(request);

        request.removeHeader("X-CSRF-Token");
        request.addHeader("X-CSRF-Token", "different");
        assertThatThrownBy(() -> service.requireValidCsrf(request))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.CSRF_TOKEN_INVALID));
    }
}
