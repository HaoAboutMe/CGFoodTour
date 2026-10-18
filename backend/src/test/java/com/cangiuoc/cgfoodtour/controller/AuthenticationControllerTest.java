package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.dto.response.AuthenticationResponse;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.exception.GlobalExceptionHandler;
import com.cangiuoc.cgfoodtour.service.AuthAbuseProtectionService;
import com.cangiuoc.cgfoodtour.service.AuthenticationService;
import com.cangiuoc.cgfoodtour.service.UserService;
import com.cangiuoc.cgfoodtour.service.ClientIpResolver;
import com.cangiuoc.cgfoodtour.service.AuthCookieService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationControllerTest {
    private UserService userService;
    private AuthenticationService authenticationService;
    private AuthCookieService authCookieService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        authenticationService = mock(AuthenticationService.class);
        authCookieService = mock(AuthCookieService.class);
        ClientIpResolver clientIpResolver = mock(ClientIpResolver.class);
        when(clientIpResolver.resolve(any())).thenReturn("127.0.0.1");
        AuthenticationController controller = new AuthenticationController(
                authenticationService, mock(AuthAbuseProtectionService.class), userService, clientIpResolver,
                authCookieService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void registrationUsesCanonicalEndpointAndRequiresDateOfBirth() throws Exception {
        when(userService.createUser(any(), any())).thenReturn(UserResponse.builder().email("user@example.com").build());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"foodlover","firstname":"Food","lastname":"Lover","email":"user@example.com",
                                 "password":"password123","dateOfBirth":"2000-01-20"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.email").value("user@example.com"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"foodlover","firstname":"Food","lastname":"Lover","email":"user@example.com",
                                 "password":"password123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidVerificationTokenHasErrorStatusForApiAndLandingPage() throws Exception {
        when(userService.verifyEmail("invalid"))
                .thenThrow(new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));

        mockMvc.perform(post("/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"invalid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_VERIFICATION_TOKEN.getCode()));

        mockMvc.perform(get("/auth/verify-email/complete").param("token", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logoutReadsAccessHeaderAndRefreshCookieOutsideJsonBody() throws Exception {
        when(authCookieService.readRefreshToken(any())).thenReturn("refresh");
        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer access")
                        .header("X-CSRF-Token", "csrf"))
                .andExpect(status().isOk());

        verify(authCookieService).requireValidCsrf(any());
        verify(authenticationService).logout(eq("access"), eq("refresh"));
        verify(authCookieService).clearSessionCookies(any());
    }

    @Test
    void loginResponseDoesNotSerializeRefreshToken() throws Exception {
        when(authenticationService.authenticate(any(), any())).thenReturn(AuthenticationResponse.builder()
                .accessToken("access")
                .refreshToken("refresh-secret")
                .expiresIn(900)
                .refreshExpiresIn(3600)
                .isAuthenticated(true)
                .build());

        mockMvc.perform(post("/auth/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.accessToken").value("access"))
                .andExpect(jsonPath("$.result.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.result.refreshExpiresIn").doesNotExist());

        verify(authCookieService).writeSessionCookies(any(), eq("refresh-secret"));
    }
}
