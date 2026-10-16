package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.constant.SuccessMessage;
import com.cangiuoc.cgfoodtour.dto.request.*;
import com.cangiuoc.cgfoodtour.dto.response.AuthenticationResponse;
import com.cangiuoc.cgfoodtour.dto.response.IntrospectResponse;
import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.service.AuthenticationService;
import com.cangiuoc.cgfoodtour.service.AuthAbuseProtectionService;
import com.cangiuoc.cgfoodtour.service.UserService;
import com.nimbusds.jose.JOSEException;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;
    AuthAbuseProtectionService authAbuseProtectionService;
    UserService userService;

    public AuthenticationController(AuthenticationService authenticationService,
                                    AuthAbuseProtectionService authAbuseProtectionService,
                                    UserService userService) {
        this.authenticationService = authenticationService;
        this.authAbuseProtectionService = authAbuseProtectionService;
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    ApiResponse<UserResponse> register(@RequestBody @Valid UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .message(SuccessMessage.REGISTER_SUCCESS)
                .build();
    }

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .message(SuccessMessage.LOGIN_SUCCESS)
                .build();
    }

    @PostMapping("/google-login")
    ApiResponse<AuthenticationResponse> googleLogin(@RequestBody @Valid GoogleLoginRequest request) {
        var result = authenticationService.googleAuthenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .message(SuccessMessage.GOOGLE_LOGIN_SUCCESS)
                .build();
    }

    @PostMapping("/facebook-login")
    ApiResponse<AuthenticationResponse> facebookLogin(@RequestBody @Valid com.cangiuoc.cgfoodtour.dto.request.FacebookLoginRequest request) {
        var result = authenticationService.facebookAuthenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .message(SuccessMessage.FACEBOOK_LOGIN_SUCCESS)
                .build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .message(SuccessMessage.INTROSPECT_SUCCESS)
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody @Valid LogOutRequest request) {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder()
                .message(SuccessMessage.LOGOUT_SUCCESS)
                .build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> refresh(@RequestBody @Valid RefreshRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .message(SuccessMessage.REFRESH_TOKEN_SUCCESS)
                .build();
    }

    @PostMapping("/verify-email")
    ApiResponse<UserResponse> verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.verifyEmail(request.getToken()))
                .message(SuccessMessage.VERIFY_EMAIL_SUCCESS)
                .build();
    }

    @GetMapping(value = "/verify-email/complete", produces = MediaType.TEXT_HTML_VALUE)
    ResponseEntity<String> completeEmailVerification(@RequestParam String token) {
        try {
            var result = userService.verifyEmail(token);
            return ResponseEntity.ok(buildSuccessPage(HtmlUtils.htmlEscape(result.getEmail())));
        } catch (AppException e) {
            return ResponseEntity.badRequest().body(buildErrorPage(
                    HtmlUtils.htmlEscape(e.getErrorCode().getMessage())));
        }
    }

    private String buildSuccessPage(String email) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Xác Thực Thành Công - Cần Giuộc FoodTour</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background-color: #F7F6F2;
                            color: #111111;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 20px;
                        }
                        .container {
                            background-color: #FFFFFF;
                            border: 3.5px solid #111111;
                            border-radius: 20px;
                            box-shadow: 8px 8px 0px #111111;
                            max-width: 520px;
                            width: 100%%;
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .badge {
                            display: inline-block;
                            background-color: #00CA4E;
                            color: #FFFFFF;
                            padding: 8px 18px;
                            border: 2.5px solid #111111;
                            border-radius: 999px;
                            font-size: 13px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            box-shadow: 3px 3px 0px #111111;
                            margin-bottom: 24px;
                        }
                        .icon-box {
                            width: 72px;
                            height: 72px;
                            background-color: #E6FCF0;
                            border: 3px solid #111111;
                            border-radius: 50%%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                            box-shadow: 4px 4px 0px #111111;
                        }
                        .icon-box svg {
                            width: 40px;
                            height: 40px;
                            stroke: #00CA4E;
                            fill: none;
                            stroke-width: 3.5;
                            stroke-linecap: round;
                            stroke-linejoin: round;
                        }
                        h1 {
                            font-size: 26px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: #111111;
                            margin-bottom: 12px;
                        }
                        p {
                            font-size: 15px;
                            font-weight: 600;
                            color: #444444;
                            line-height: 1.6;
                            margin-bottom: 8px;
                        }
                        .email-highlight {
                            background-color: #F7F6F2;
                            border: 2px solid #111111;
                            border-radius: 10px;
                            padding: 10px 16px;
                            display: inline-block;
                            font-weight: 800;
                            color: #FF3E3E;
                            font-family: monospace;
                            margin: 12px 0 24px;
                            box-shadow: 3px 3px 0px #111111;
                        }
                        .btn {
                            display: inline-block;
                            padding: 14px 36px;
                            background-color: #FF3E3E;
                            color: #FFFFFF !important;
                            text-decoration: none;
                            font-size: 15px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border: 3px solid #111111;
                            border-radius: 12px;
                            box-shadow: 5px 5px 0px #111111;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="badge">🍜 CẦN GIUỘC FOODTOUR</div>
                        <div class="icon-box">
                            <svg viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h1>XÁC THỰC THÀNH CÔNG! 🎉</h1>
                        <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
                        <div>
                            <span class="email-highlight">%s</span>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Bây giờ bạn có thể quay lại ứng dụng để tiến hành Đăng Nhập và trải nghiệm dịch vụ.</p>
                        <a href="javascript:void(0)" class="btn" onclick="if(window.opener){window.close();}else{location.href='/';}">Quay Lại Đăng Nhập ↗</a>
                    </div>
                </body>
                </html>
                """
                .formatted(email);
    }

    private String buildErrorPage(String errorMessage) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Xác Thực Thất Bại - Cần Giuộc FoodTour</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background-color: #F7F6F2;
                            color: #111111;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 20px;
                        }
                        .container {
                            background-color: #FFFFFF;
                            border: 3.5px solid #111111;
                            border-radius: 20px;
                            box-shadow: 8px 8px 0px #111111;
                            max-width: 520px;
                            width: 100%%;
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .badge {
                            display: inline-block;
                            background-color: #FF3E3E;
                            color: #FFFFFF;
                            padding: 8px 18px;
                            border: 2.5px solid #111111;
                            border-radius: 999px;
                            font-size: 13px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            box-shadow: 3px 3px 0px #111111;
                            margin-bottom: 24px;
                        }
                        .icon-box {
                            width: 72px;
                            height: 72px;
                            background-color: #FFEBEB;
                            border: 3px solid #111111;
                            border-radius: 50%%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                            box-shadow: 4px 4px 0px #111111;
                        }
                        .icon-box svg {
                            width: 40px;
                            height: 40px;
                            stroke: #FF3E3E;
                            fill: none;
                            stroke-width: 3.5;
                            stroke-linecap: round;
                            stroke-linejoin: round;
                        }
                        h1 {
                            font-size: 26px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: #111111;
                            margin-bottom: 12px;
                        }
                        p {
                            font-size: 15px;
                            font-weight: 600;
                            color: #444444;
                            line-height: 1.6;
                            margin-bottom: 8px;
                        }
                        .error-card {
                            background-color: #FFFBEB;
                            border: 2.5px solid #111111;
                            border-radius: 12px;
                            padding: 14px 18px;
                            margin: 18px 0 24px;
                            box-shadow: 3px 3px 0px #111111;
                            text-align: left;
                        }
                        .error-card p {
                            margin: 0;
                            font-size: 13px;
                            font-weight: 700;
                            color: #B45309;
                        }
                        .btn {
                            display: inline-block;
                            padding: 14px 36px;
                            background-color: #111111;
                            color: #FFFFFF !important;
                            text-decoration: none;
                            font-size: 15px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border: 3px solid #111111;
                            border-radius: 12px;
                            box-shadow: 5px 5px 0px #888888;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="badge">❌ XÁC THỰC THẤT BẠI</div>
                        <div class="icon-box">
                            <svg viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                        <h1>LIÊN KẾT KHÔNG HỢP LỆ!</h1>
                        <p>Rất tiếc, không thể kích hoạt tài khoản của bạn.</p>
                        <div class="error-card">
                            <p>📌 <strong>Chi tiết lỗi:</strong> %s</p>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Liên kết kích hoạt có thể đã hết hạn hoặc đã được sử dụng trước đó. Bạn có thể gửi lại yêu cầu kích hoạt mới từ ứng dụng.</p>
                        <a href="javascript:void(0)" class="btn" onclick="if(window.opener){window.close();}else{location.href='/';}">Đóng Cửa Sổ ↗</a>
                    </div>
                </body>
                </html>
                """
                .formatted((errorMessage != null && !errorMessage.isBlank()) ? errorMessage : "Token kích hoạt không tồn tại hoặc đã hết hạn.");
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    ApiResponse<String> resendVerificationEmail(@RequestParam String email,
                                                HttpServletRequest httpRequest) {
        String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
        authAbuseProtectionService.checkIssue(normalizedEmail, httpRequest.getRemoteAddr());
        userService.resendVerificationEmail(normalizedEmail);
        return ApiResponse.<String>builder()
                .result("If the account is eligible, a verification email will be sent.")
                .message(SuccessMessage.SEND_VERIFICATION_SUCCESS)
                .build();
    }

    // ========== FORGOT PASSWORD ==========

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    ApiResponse<String> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request,
                                       HttpServletRequest httpRequest) {
        authenticationService.forgotPassword(request, httpRequest.getRemoteAddr());
        return ApiResponse.<String>builder()
                .result("If the account is eligible, password reset instructions will be sent.")
                .message(SuccessMessage.FORGOT_PASSWORD_SUCCESS)
                .build();
    }

    @PostMapping("/verify-otp")
    ApiResponse<String> verifyOtp(@RequestBody @Valid VerifyOtpRequest request,
                                  HttpServletRequest httpRequest) {
        authenticationService.verifyOtp(request, httpRequest.getRemoteAddr());
        return ApiResponse.<String>builder()
                .result("OTP is valid")
                .message("OTP_VALID")
                .build();
    }

    @PostMapping("/reset-password")
    ApiResponse<String> resetPassword(@RequestBody @Valid ResetPasswordRequest request,
                                      HttpServletRequest httpRequest) {
        authenticationService.resetPassword(request, httpRequest.getRemoteAddr());
        return ApiResponse.<String>builder()
                .result("Password reset successfully")
                .message(SuccessMessage.RESET_PASSWORD_SUCCESS)
                .build();
    }
}
