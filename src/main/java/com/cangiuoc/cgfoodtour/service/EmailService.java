package com.cangiuoc.cgfoodtour.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class EmailService {
    final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    String fromEmail;

    @Value("${app.base-url:http://localhost:8080/api}")
    String baseUrl;

    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Xác thực tài khoản - CGFoodTour");

            String verificationLink = baseUrl + "/auth/verify-email?token=" + token;

            String htmlContent = buildEmailTemplate(verificationLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {} - Error: {}", toEmail, e.getMessage());
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Mã OTP Đặt Lại Mật Khẩu - CGFoodTour");

            String htmlContent = buildOtpEmailTemplate(otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {} - Error: {}", toEmail, e.getMessage());
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    private String buildEmailTemplate(String verificationLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Outfit', 'Lexend', system-ui, -apple-system, sans-serif;
                            background-color: #F7F6F0;
                            color: #0F172A;
                            padding: 40px 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #FFFFFF;
                            border: 2px solid #0F172A;
                            border-radius: 32px;
                            box-shadow: 6px 6px 0px #0F172A;
                            padding: 30px;
                        }
                        .content {
                            padding: 10px 10px;
                        }
                        .content h2 {
                            font-size: 24px;
                            font-weight: 800;
                            margin-bottom: 15px;
                            color: #0F172A;
                        }
                        .content p {
                            font-size: 15px;
                            font-weight: 500;
                            line-height: 1.6;
                            margin-bottom: 25px;
                            color: #334155;
                        }
                        .button-container {
                            text-align: center;
                            margin: 35px 0;
                        }
                        .button {
                            display: inline-block;
                            padding: 14px 40px;
                            background-color: #FF5F38;
                            color: #FFFFFF !important;
                            text-decoration: none;
                            font-size: 16px;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border: 2px solid #0F172A;
                            border-radius: 9999px;
                            box-shadow: 4px 4px 0px #0F172A;
                            transition: all 0.15s ease-in-out;
                        }
                        .button:hover {
                            transform: translate(-2px, -2px);
                            box-shadow: 6px 6px 0px #0F172A;
                        }
                        .info-card {
                            background-color: #F8FAFC;
                            border: 2px solid #0F172A;
                            border-radius: 20px;
                            padding: 20px;
                            margin: 25px 0;
                            box-shadow: 4px 4px 0px #0F172A;
                        }
                        .info-card p {
                            margin: 0;
                            font-size: 14px;
                            font-weight: 600;
                            color: #0F172A;
                        }
                        .link-pill {
                            background-color: #F1F5F9;
                            border: 2px solid #0F172A;
                            border-radius: 9999px;
                            padding: 12px 24px;
                            margin: 20px 0;
                            word-break: break-all;
                            text-align: center;
                        }
                        .link-pill p {
                            margin: 0;
                            font-size: 13px;
                            font-family: monospace;
                            font-weight: 600;
                            color: #1E60D5;
                        }
                        .footer {
                            margin-top: 40px;
                            border-top: 2px solid #E2E8F0;
                            padding-top: 25px;
                            text-align: center;
                        }
                        .footer p {
                            font-size: 13px;
                            font-weight: 600;
                            color: #64748B;
                            margin-bottom: 8px;
                        }
                        .footer a {
                            color: #1E60D5;
                            text-decoration: none;
                            font-weight: 700;
                            margin: 0 8px;
                        }
                        @media only screen and (max-width: 600px) {
                            body {
                                padding: 20px 10px;
                            }
                            .container {
                                padding: 20px;
                                border-radius: 24px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 2px solid #0F172A; border-radius: 9999px; padding: 8px 12px; box-shadow: 4px 4px 0px #0F172A; margin-bottom: 35px;">
                            <tr>
                                <td align="left">
                                    <span style="background-color: #1E60D5; color: #FFFFFF; padding: 8px 20px; border-radius: 9999px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">🍜 CGFoodTour</span>
                                </td>
                                <td align="right" style="padding-right: 10px;">
                                    <span style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">Verification</span>
                                </td>
                            </tr>
                        </table>

                        <div class="content">
                            <h2>Verify Your Email</h2>
                            <p>Thank you for signing up for Can Giuoc Food Tour. To get started exploring amazing local culinary destinations, please verify your email address by clicking the button below.</p>

                            <div class="button-container">
                                <a href="%s" class="button">Verify My Account</a>
                            </div>

                            <div class="info-card">
                                <p>📌 If the button above does not work, please copy and paste the following web link directly into your browser address bar:</p>
                                <div class="link-pill" style="margin-bottom: 0; margin-top: 15px;">
                                    <p>%s</p>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <p><strong>Can Giuoc Food Tour Team</strong></p>
                            <p>&copy; 2026 CGFoodTour. All rights reserved.</p>
                            <p style="margin-top: 10px;">
                                <a href="#">Support</a> | <a href="#">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(verificationLink, verificationLink);
    }

    private String buildOtpEmailTemplate(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Outfit', 'Lexend', system-ui, -apple-system, sans-serif;
                            background-color: #F7F6F0;
                            color: #0F172A;
                            padding: 40px 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #FFFFFF;
                            border: 2px solid #0F172A;
                            border-radius: 32px;
                            box-shadow: 6px 6px 0px #0F172A;
                            padding: 30px;
                        }
                        .content {
                            padding: 10px 10px;
                        }
                        .content p {
                            font-size: 15px;
                            font-weight: 500;
                            line-height: 1.6;
                            margin-bottom: 25px;
                            color: #334155;
                        }
                        .otp-container {
                            text-align: center;
                            margin: 35px 0;
                        }
                        .otp-pill {
                            display: inline-block;
                            background-color: #FFFFFF;
                            border: 2px solid #0F172A;
                            border-radius: 9999px;
                            padding: 18px 50px;
                            box-shadow: 4px 4px 0px #0F172A;
                        }
                        .otp-label {
                            font-size: 11px;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            color: #64748B;
                            margin-bottom: 6px;
                        }
                        .otp-code {
                            font-size: 40px;
                            font-weight: 900;
                            letter-spacing: 8px;
                            color: #1E60D5;
                            font-family: 'Courier New', Courier, monospace;
                        }
                        .warning-card {
                            background-color: #FFFBEB;
                            border: 2px solid #0F172A;
                            border-radius: 20px;
                            padding: 20px;
                            margin: 25px 0;
                            box-shadow: 4px 4px 0px #0F172A;
                        }
                        .warning-card p {
                            margin: 0;
                            font-size: 14px;
                            font-weight: 600;
                            color: #B45309;
                        }
                        .footer {
                            margin-top: 40px;
                            border-top: 2px solid #E2E8F0;
                            padding-top: 25px;
                            text-align: center;
                        }
                        .footer p {
                            font-size: 13px;
                            font-weight: 600;
                            color: #64748B;
                            margin-bottom: 8px;
                        }
                        @media only screen and (max-width: 600px) {
                            body {
                                padding: 20px 10px;
                            }
                            .container {
                                padding: 20px;
                                border-radius: 24px;
                            }
                            .otp-pill {
                                padding: 14px 30px;
                            }
                            .otp-code {
                                font-size: 32px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 2px solid #0F172A; border-radius: 9999px; padding: 8px 12px; box-shadow: 4px 4px 0px #0F172A; margin-bottom: 35px;">
                            <tr>
                                <td align="left">
                                    <span style="background-color: #1E60D5; color: #FFFFFF; padding: 8px 20px; border-radius: 9999px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">🔐 Security</span>
                                </td>
                                <td align="right" style="padding-right: 10px;">
                                    <span style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">OTP Code</span>
                                </td>
                            </tr>
                        </table>

                        <div class="content">
                            <p>We received a request to reset the password for your CGFoodTour account. Use the following One-Time Password (OTP) to complete your verification:</p>

                            <div class="otp-container">
                                <div class="otp-pill">
                                    <div class="otp-label">Verification OTP Code</div>
                                    <div class="otp-code">%s</div>
                                </div>
                            </div>

                            <div class="warning-card">
                                <p>⏰ <strong>Valid for 5 minutes.</strong> For security reasons, please do not share this code with anyone.</p>
                            </div>
                        </div>

                        <div class="footer">
                            <p><strong>Can Giuoc Food Tour Team</strong></p>
                            <p>&copy; 2026 CGFoodTour. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(otp);
    }
}
