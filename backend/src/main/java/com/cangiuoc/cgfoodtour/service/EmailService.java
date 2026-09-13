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
                            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            background-color: #F7F6F2;
                            color: #111111;
                            padding: 30px 15px;
                        }
                        .container {
                            max-width: 580px;
                            margin: 0 auto;
                            background-color: #FFFFFF;
                            border: 3px solid #111111;
                            border-radius: 20px;
                            box-shadow: 8px 8px 0px #111111;
                            padding: 32px 28px;
                        }
                        .header-pill {
                            background-color: #FF3E3E;
                            color: #FFFFFF;
                            padding: 10px 20px;
                            border: 2.5px solid #111111;
                            border-radius: 999px;
                            font-size: 13px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            display: inline-block;
                            box-shadow: 3px 3px 0px #111111;
                        }
                        .header-table {
                            width: 100%%;
                            margin-bottom: 28px;
                            border-bottom: 3px solid #111111;
                            padding-bottom: 16px;
                        }
                        .content h2 {
                            font-size: 24px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 14px;
                            color: #111111;
                        }
                        .content p {
                            font-size: 15px;
                            font-weight: 600;
                            line-height: 1.6;
                            margin-bottom: 20px;
                            color: #333333;
                        }
                        .button-container {
                            text-align: center;
                            margin: 32px 0;
                        }
                        .button {
                            display: inline-block;
                            padding: 16px 36px;
                            background-color: #FF3E3E;
                            color: #FFFFFF !important;
                            text-decoration: none;
                            font-size: 15px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border: 3px solid #111111;
                            border-radius: 14px;
                            box-shadow: 5px 5px 0px #111111;
                        }
                        .info-card {
                            background-color: #F7F6F2;
                            border: 2.5px solid #111111;
                            border-radius: 16px;
                            padding: 18px;
                            margin: 24px 0;
                            box-shadow: 4px 4px 0px #111111;
                        }
                        .info-card p {
                            margin: 0;
                            font-size: 13px;
                            font-weight: 700;
                            color: #111111;
                        }
                        .link-pill {
                            background-color: #FFFFFF;
                            border: 2px solid #111111;
                            border-radius: 10px;
                            padding: 12px 16px;
                            margin-top: 12px;
                            word-break: break-all;
                            text-align: left;
                        }
                        .link-pill p {
                            margin: 0;
                            font-size: 12px;
                            font-family: 'Courier New', Courier, monospace;
                            font-weight: 700;
                            color: #FF3E3E;
                        }
                        .footer {
                            margin-top: 32px;
                            border-top: 3px solid #111111;
                            padding-top: 20px;
                            text-align: center;
                        }
                        .footer p {
                            font-size: 12px;
                            font-weight: 800;
                            color: #555555;
                            margin-bottom: 6px;
                        }
                        @media only screen and (max-width: 600px) {
                            body {
                                padding: 15px 8px;
                            }
                            .container {
                                padding: 20px 16px;
                                border-radius: 16px;
                            }
                            .button {
                                padding: 14px 24px;
                                font-size: 14px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <table class="header-table" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="left">
                                    <span class="header-pill">🍜 CẦN GIUỘC FOODTOUR</span>
                                </td>
                                <td align="right">
                                    <span style="font-size: 12px; font-weight: 900; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">XÁC THỰC EMAIL</span>
                                </td>
                            </tr>
                        </table>

                        <div class="content">
                            <h2>Kích Hoạt Tài Khoản Của Bạn 🚀</h2>
                            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Cần Giuộc FoodTour</strong>! Để bắt đầu trải nghiệm và khám phá bản đồ ẩm thực đặc sản hấp dẫn, vui lòng bấm vào nút bên dưới để kích hoạt tài khoản:</p>

                            <div class="button-container">
                                <a href="%s" class="button">Kích Hoạt Tài Khoản Ngay ↗</a>
                            </div>

                            <div class="info-card">
                                <p>📌 <strong>Mẹo:</strong> Nếu nút bấm trên không hoạt động, bạn có thể sao chép liên kết dưới đây và dán trực tiếp vào trình duyệt:</p>
                                <div class="link-pill">
                                    <p>%s</p>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <p><strong>Cần Giuộc FoodTour Team &copy; 2026</strong></p>
                            <p>Khám phá văn hóa ẩm thực Cần Giuộc - Nhanh chóng & Tiện lợi</p>
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
                            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            background-color: #F7F6F2;
                            color: #111111;
                            padding: 30px 15px;
                        }
                        .container {
                            max-width: 580px;
                            margin: 0 auto;
                            background-color: #FFFFFF;
                            border: 3px solid #111111;
                            border-radius: 20px;
                            box-shadow: 8px 8px 0px #111111;
                            padding: 32px 28px;
                        }
                        .header-pill {
                            background-color: #FF3E3E;
                            color: #FFFFFF;
                            padding: 10px 20px;
                            border: 2.5px solid #111111;
                            border-radius: 999px;
                            font-size: 13px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            display: inline-block;
                            box-shadow: 3px 3px 0px #111111;
                        }
                        .header-table {
                            width: 100%%;
                            margin-bottom: 28px;
                            border-bottom: 3px solid #111111;
                            padding-bottom: 16px;
                        }
                        .content p {
                            font-size: 15px;
                            font-weight: 600;
                            line-height: 1.6;
                            margin-bottom: 20px;
                            color: #333333;
                        }
                        .otp-container {
                            text-align: center;
                            margin: 32px 0;
                        }
                        .otp-box {
                            display: inline-block;
                            background-color: #FFE600;
                            border: 3px solid #111111;
                            border-radius: 16px;
                            padding: 20px 44px;
                            box-shadow: 6px 6px 0px #111111;
                        }
                        .otp-label {
                            font-size: 12px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            color: #111111;
                            margin-bottom: 8px;
                        }
                        .otp-code {
                            font-size: 42px;
                            font-weight: 900;
                            letter-spacing: 10px;
                            color: #FF3E3E;
                            font-family: 'Courier New', Courier, monospace;
                        }
                        .warning-card {
                            background-color: #FFFBEB;
                            border: 2.5px solid #111111;
                            border-radius: 14px;
                            padding: 16px;
                            margin: 24px 0;
                            box-shadow: 4px 4px 0px #111111;
                        }
                        .warning-card p {
                            margin: 0;
                            font-size: 13px;
                            font-weight: 700;
                            color: #B45309;
                        }
                        .footer {
                            margin-top: 32px;
                            border-top: 3px solid #111111;
                            padding-top: 20px;
                            text-align: center;
                        }
                        .footer p {
                            font-size: 12px;
                            font-weight: 800;
                            color: #555555;
                            margin-bottom: 6px;
                        }
                        @media only screen and (max-width: 600px) {
                            body {
                                padding: 15px 8px;
                            }
                            .container {
                                padding: 20px 16px;
                            }
                            .otp-box {
                                padding: 16px 28px;
                            }
                            .otp-code {
                                font-size: 34px;
                                letter-spacing: 6px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <table class="header-table" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="left">
                                    <span class="header-pill">🔐 BẢO MẬT HỆ THỐNG</span>
                                </td>
                                <td align="right">
                                    <span style="font-size: 12px; font-weight: 900; color: #111111; text-transform: uppercase; letter-spacing: 0.5px;">MÃ OTP</span>
                                </td>
                            </tr>
                        </table>

                        <div class="content">
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Cần Giuộc FoodTour của bạn. Vui lòng sử dụng mã OTP gồm 6 chữ số dưới đây để tiến hành đổi mật khẩu:</p>

                            <div class="otp-container">
                                <div class="otp-box">
                                    <div class="otp-label">MÃ OTP XÁC THỰC</div>
                                    <div class="otp-code">%s</div>
                                </div>
                            </div>

                            <div class="warning-card">
                                <p>⏰ <strong>Lưu ý:</strong> Mã OTP có hiệu lực trong <strong>5 phút</strong>. Vì mục đích bảo mật, tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                            </div>
                        </div>

                        <div class="footer">
                            <p><strong>Cần Giuộc FoodTour Team &copy; 2026</strong></p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(otp);
    }

    @Async
    public void sendStoreStatusNotificationEmail(String toEmail, String storeName, String actionType, String reason) {
        if (toEmail == null || toEmail.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);

            String actionText = "HIDE".equalsIgnoreCase(actionType) ? "đã bị ẨN" : "đã bị XÓA VĨNH VIỄN";
            helper.setSubject("Thông báo về quán ăn: " + storeName + " - CGFoodTour");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Space Grotesk', sans-serif; background-color: #F7F6F2; color: #111111; padding: 25px 15px; }
                        .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 3px solid #111111; border-radius: 20px; padding: 28px; box-shadow: 6px 6px 0px #111111; }
                        .header { background-color: #FF3E3E; color: #FFFFFF; padding: 12px 20px; border: 2.5px solid #111111; border-radius: 12px; font-size: 15px; font-weight: 900; text-transform: uppercase; margin-bottom: 24px; box-shadow: 3px 3px 0px #111111; }
                        .reason-card { background-color: #FFFBEB; border: 2.5px solid #111111; border-radius: 14px; padding: 18px; margin: 20px 0; box-shadow: 4px 4px 0px #111111; }
                        .reason-card p { margin: 0; font-size: 14px; font-weight: 700; color: #111111; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">📢 THÔNG BÁO TỪ QUẢN TRỊ VIÊN CGFoodTour</div>
                        <p style="font-size: 15px; font-weight: 600;">Xin chào Chủ quán,</p>
                        <p style="font-size: 15px; font-weight: 600; margin-top: 10px;">Quản trị viên hệ thống đã thực hiện thao tác đối với quán ăn <strong>%s</strong> của bạn. Trạng thái hiện tại: <strong style="color: #FF3E3E;">%s</strong>.</p>
                        <div class="reason-card">
                            <p>📌 <strong>Lý do từ Admin:</strong></p>
                            <p style="margin-top: 6px; font-style: italic;">"%s"</p>
                        </div>
                        <p style="font-size: 14px; font-weight: 600; color: #555555;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận hỗ trợ CGFoodTour.</p>
                        <p style="font-size: 14px; font-weight: 800; margin-top: 16px;">Trân trọng,<br><strong>Cần Giuộc FoodTour Team</strong></p>
                    </div>
                </body>
                </html>
                """.formatted(storeName, actionText, (reason != null && !reason.isBlank()) ? reason : "Không có lý do chi tiết");

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Store notification email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send store status notification email to: {} - Error: {}", toEmail, e.getMessage());
        }
    }
}
