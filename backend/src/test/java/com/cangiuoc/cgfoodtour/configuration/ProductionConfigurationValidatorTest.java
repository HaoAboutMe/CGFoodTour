package com.cangiuoc.cgfoodtour.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductionConfigurationValidatorTest {

    @Test
    void acceptsCompleteHardenedConfiguration() {
        var validator = new ProductionConfigurationValidator(validEnvironment());

        assertDoesNotThrow(validator::validate);
    }

    @Test
    void rejectsLocalhostDatabase() {
        MockEnvironment environment = validEnvironment()
                .withProperty("spring.datasource.url", "jdbc:mysql://localhost:3306/cgfoodtour?useSSL=false");

        assertThrows(IllegalStateException.class,
                () -> new ProductionConfigurationValidator(environment).validate());
    }

    @Test
    void rejectsMissingAndPlaceholderSecrets() {
        MockEnvironment missing = validEnvironment().withProperty("cloudinary.api-secret", "");
        MockEnvironment placeholder = validEnvironment().withProperty("spring.mail.password", "CHANGE_ME");

        assertThrows(IllegalStateException.class,
                () -> new ProductionConfigurationValidator(missing).validate());
        assertThrows(IllegalStateException.class,
                () -> new ProductionConfigurationValidator(placeholder).validate());
    }

    @Test
    void rejectsSharedPepperAndInsecureApplicationUrl() {
        MockEnvironment sharedPepper = validEnvironment()
                .withProperty("security.otp.pepper", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
        MockEnvironment httpUrl = validEnvironment().withProperty("app.base-url", "http://example.com/api");

        assertThrows(IllegalStateException.class,
                () -> new ProductionConfigurationValidator(sharedPepper).validate());
        assertThrows(IllegalStateException.class,
                () -> new ProductionConfigurationValidator(httpUrl).validate());
    }

    private MockEnvironment validEnvironment() {
        return new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:mysql://db.internal:3306/cgfoodtour?sslMode=VERIFY_IDENTITY")
                .withProperty("spring.datasource.username", "cgfoodtour")
                .withProperty("spring.datasource.password", "database-secret")
                .withProperty("spring.mail.host", "smtp.example.com")
                .withProperty("spring.mail.username", "mailer@example.com")
                .withProperty("spring.mail.password", "mail-secret")
                .withProperty("app.base-url", "https://example.com/api")
                .withProperty("app.cors.allowed-origins", "https://example.com,https://www.example.com")
                .withProperty("app.admin.default-email", "admin@example.com")
                .withProperty("app.google.client-id", "google-client")
                .withProperty("app.facebook.app-id", "facebook-id")
                .withProperty("app.facebook.app-secret", "facebook-secret")
                .withProperty("jwt.signerKey", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
                .withProperty("security.registration.ip-pepper", "registration-pepper-that-is-independent")
                .withProperty("security.otp.pepper", "otp-pepper-that-is-independent")
                .withProperty("cloudinary.cloud-name", "cloud")
                .withProperty("cloudinary.api-key", "key")
                .withProperty("cloudinary.api-secret", "secret");
    }
}
