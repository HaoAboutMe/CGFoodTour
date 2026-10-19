package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.exception.AppException;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class EmailServiceTest {
    private JavaMailSender mailSender;
    private SimpleMeterRegistry meterRegistry;
    private EmailService emailService;
    private MimeMessage message;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        meterRegistry = new SimpleMeterRegistry();
        emailService = new EmailService(mailSender, meterRegistry);
        ReflectionTestUtils.setField(emailService, "fromEmail", "sender@example.com");
        ReflectionTestUtils.setField(emailService, "baseUrl", "https://example.com/api");
        ReflectionTestUtils.setField(emailService, "maximumAttempts", 3);
        ReflectionTestUtils.setField(emailService, "retryInitialDelayMs", 0L);
        message = new JavaMailSenderImpl().createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(message);
    }

    @Test
    void retriesTransientFailureAndRecordsOutcome() {
        doThrow(new MailSendException("temporary"))
                .doNothing()
                .when(mailSender).send(message);

        emailService.sendVerificationEmail("user@example.com", "token");

        verify(mailSender, times(2)).send(message);
        assertEquals(1D, count("verification", "retry"));
        assertEquals(1D, count("verification", "sent"));
    }

    @Test
    void criticalEmailFailsTruthfullyAfterBoundedRetries() {
        doThrow(new MailSendException("down")).when(mailSender).send(message);

        assertThrows(AppException.class,
                () -> emailService.sendOtpEmail("user@example.com", "123456"));

        verify(mailSender, times(3)).send(message);
        assertEquals(2D, count("password_reset_otp", "retry"));
        assertEquals(1D, count("password_reset_otp", "failed"));
    }

    private double count(String template, String outcome) {
        var counter = meterRegistry.find("cgfoodtour.email.delivery")
                .tags("template", template, "outcome", outcome)
                .counter();
        return counter == null ? 0 : counter.count();
    }
}
