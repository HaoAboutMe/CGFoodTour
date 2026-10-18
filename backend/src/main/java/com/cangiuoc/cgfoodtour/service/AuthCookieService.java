package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthCookieService {
    private static final String CSRF_HEADER = "X-CSRF-Token";
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.auth-cookie.refresh-name:cgft_refresh}")
    private String refreshCookieName;

    @Value("${app.auth-cookie.csrf-name:cgft_csrf}")
    private String csrfCookieName;

    @Value("${app.auth-cookie.secure:false}")
    private boolean secure;

    @Value("${app.auth-cookie.same-site:Strict}")
    private String sameSite;

    @Value("${jwt.refreshable-duration}")
    private long refreshDuration;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Value("${app.cors.include-local-origins:true}")
    private boolean includeLocalOrigins;

    public String readRefreshToken(HttpServletRequest request) {
        return readCookie(request, refreshCookieName);
    }

    public void writeSessionCookies(HttpServletResponse response, String refreshToken) {
        addCookie(response, refreshCookieName, refreshToken, true, refreshDuration);
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        addCookie(response, csrfCookieName, Base64.getUrlEncoder().withoutPadding().encodeToString(bytes), false,
                refreshDuration);
    }

    public void clearSessionCookies(HttpServletResponse response) {
        addCookie(response, refreshCookieName, "", true, 0);
        addCookie(response, csrfCookieName, "", false, 0);
    }

    public void requireValidCsrf(HttpServletRequest request) {
        String cookieToken = readCookie(request, csrfCookieName);
        String headerToken = request.getHeader(CSRF_HEADER);
        if (cookieToken == null || headerToken == null
                || !MessageDigest.isEqual(cookieToken.getBytes(StandardCharsets.UTF_8),
                headerToken.getBytes(StandardCharsets.UTF_8))) {
            throw new AppException(ErrorCode.CSRF_TOKEN_INVALID);
        }

        String origin = request.getHeader(HttpHeaders.ORIGIN);
        if (origin == null || origin.isBlank() || !allowedOriginSet().contains(origin)) {
            throw new AppException(ErrorCode.CSRF_TOKEN_INVALID);
        }
    }

    private Set<String> allowedOriginSet() {
        Set<String> origins = new HashSet<>();
        if (includeLocalOrigins) origins.addAll(Set.of(
                "http://localhost:5173", "http://localhost:3000",
                "http://localhost:5500", "http://127.0.0.1:5500",
                "http://localhost:5501", "http://127.0.0.1:5501",
                "http://localhost:5502", "http://127.0.0.1:5502"));
        origins.addAll(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank() && !value.contains("*"))
                .collect(Collectors.toSet()));
        return Set.copyOf(origins);
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void addCookie(HttpServletResponse response, String name, String value, boolean httpOnly,
                           long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
