package com.cangiuoc.cgfoodtour.service;

import jakarta.mail.internet.MimeMessage;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import org.springframework.web.util.HtmlUtils;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class EmailService {
    final JavaMailSender mailSender;
    final MeterRegistry meterRegistry;

    @Value("${spring.mail.username}")
    String fromEmail;

    @Value("${app.base-url:http://localhost:8080/api}")
    String baseUrl;

    @Value("${app.email.maximum-attempts:3}")
    int maximumAttempts;

    @Value("${app.email.retry-initial-delay-ms:500}")
    long retryInitialDelayMs;

    public void sendVerificationEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Xác thực tài khoản - CGFoodTour");

            String verificationLink = baseUrl + "/auth/verify-email/complete?token=" + token;

            String htmlContent = EmailTemplateBuilder.buildVerificationHtml(verificationLink);
            String plainText = EmailTemplateBuilder.buildVerificationPlainText(verificationLink);
            helper.setText(plainText, htmlContent);

            sendMessageWithRetry(message, "verification");
            log.info("Verification email dispatched successfully");
        } catch (Exception e) {
            log.error("Failed to send verification email", e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Mã OTP Đặt Lại Mật Khẩu - CGFoodTour");

            String htmlContent = EmailTemplateBuilder.buildOtpHtml(otp);
            String plainText = EmailTemplateBuilder.buildOtpPlainText(otp);
            helper.setText(plainText, htmlContent);

            sendMessageWithRetry(message, "password_reset_otp");
            log.info("OTP email dispatched successfully");
        } catch (Exception e) {
            log.error("Failed to send OTP email", e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    /**
     * Account-state notifications are best-effort: the administrative action has
     * already committed when this method is called, so an SMTP outage must not make
     * the API report that the account was not disabled.
     */
    public void sendAccountDisabledEmail(String toEmail, String username, String reason) {
        if (toEmail == null || toEmail.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Thông báo khóa tài khoản - CGFoodTour");

            String htmlContent = EmailTemplateBuilder.buildAccountDisabledHtml(username, reason);
            String plainText = EmailTemplateBuilder.buildAccountDisabledPlainText(username, reason);
            helper.setText(plainText, htmlContent);

            sendMessageWithRetry(message, "account_disabled");
            log.info("Account disabled notification dispatched successfully for user {}", username);
        } catch (Exception exception) {
            log.error("Failed to send account disabled notification", exception);
        }
    }

    public void sendAccountEnabledEmail(String toEmail, String username) {
        if (toEmail == null || toEmail.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Chào mừng bạn trở lại CGFoodTour");

            String htmlContent = EmailTemplateBuilder.buildAccountEnabledHtml(username);
            String plainText = EmailTemplateBuilder.buildAccountEnabledPlainText(username);
            helper.setText(plainText, htmlContent);

            sendMessageWithRetry(message, "account_enabled");
            log.info("Account enabled notification dispatched successfully for user {}", username);
        } catch (Exception exception) {
            log.error("Failed to send account enabled notification", exception);
        }
    }

    public void sendStoreStatusNotificationEmail(String toEmail, String storeName, String actionType, String reason) {
        if (toEmail == null || toEmail.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);

            String safeSubjectName = (storeName == null ? "Quán ăn" : storeName)
                    .replace("\r", " ").replace("\n", " ");
            helper.setSubject("Thông báo về quán ăn: " + safeSubjectName + " - CGFoodTour");

            String htmlContent = EmailTemplateBuilder.buildStoreStatusHtml(storeName, actionType, reason);
            String plainText = EmailTemplateBuilder.buildStoreStatusPlainText(storeName, actionType, reason);
            helper.setText(plainText, htmlContent);

            sendMessageWithRetry(message, "store_status");
            log.info("Store notification email dispatched successfully");
        } catch (Exception e) {
            log.error("Failed to send store status notification email after bounded retries", e);
        }
    }

    private void sendMessageWithRetry(MimeMessage message, String template) {
        RuntimeException lastFailure = null;
        int attempts = Math.max(1, maximumAttempts);
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                mailSender.send(message);
                meterRegistry.counter("cgfoodtour.email.delivery", "template", template,
                        "outcome", "sent").increment();
                return;
            } catch (RuntimeException exception) {
                lastFailure = exception;
                meterRegistry.counter("cgfoodtour.email.delivery", "template", template,
                        "outcome", attempt == attempts ? "failed" : "retry").increment();
                if (attempt < attempts) {
                    sleepBeforeRetry(attempt);
                }
            }
        }
        throw lastFailure == null ? new IllegalStateException("Email delivery failed") : lastFailure;
    }

    private void sleepBeforeRetry(int attempt) {
        long delay = Math.max(0, retryInitialDelayMs) * (1L << Math.min(attempt - 1, 10));
        try {
            Thread.sleep(delay);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Email delivery retry interrupted", exception);
        }
    }
}
