package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import com.cangiuoc.cgfoodtour.exception.GlobalExceptionHandler;
import com.cangiuoc.cgfoodtour.service.AuthAbuseProtectionService;
import com.cangiuoc.cgfoodtour.service.AuthenticationService;
import com.cangiuoc.cgfoodtour.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
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
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        authenticationService = mock(AuthenticationService.class);
        AuthenticationController controller = new AuthenticationController(
                authenticationService, mock(AuthAbuseProtectionService.class), userService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void registrationUsesCanonicalEndpointAndRequiresDateOfBirth() throws Exception {
        when(userService.createUser(any())).thenReturn(UserResponse.builder().email("user@example.com").build());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"foodlover","email":"user@example.com",
                                 "password":"password123","dateOfBirth":"2000-01-20"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.email").value("user@example.com"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"foodlover","email":"user@example.com",
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
    void logoutRequiresAndForwardsTheCompleteTokenPair() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accessToken\":\"access\",\"refreshToken\":\"refresh\"}"))
                .andExpect(status().isOk());

        verify(authenticationService).logout(any());

        mockMvc.perform(post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accessToken\":\"access\"}"))
                .andExpect(status().isBadRequest());
    }
}
