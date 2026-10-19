package com.cangiuoc.cgfoodtour.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Component
@Profile("prod")
@RequiredArgsConstructor
public class ProductionConfigurationValidator {
    private static final List<String> REQUIRED_PROPERTIES = List.of(
            "spring.datasource.url",
            "spring.datasource.username",
            "spring.datasource.password",
            "spring.mail.host",
            "spring.mail.username",
            "spring.mail.password",
            "app.base-url",
            "app.cors.allowed-origins",
            "app.admin.default-email",
            "app.google.client-id",
            "app.facebook.app-id",
            "app.facebook.app-secret",
            "jwt.signerKey",
            "security.registration.ip-pepper",
            "security.otp.pepper",
            "cloudinary.cloud-name",
            "cloudinary.api-key",
            "cloudinary.api-secret"
    );

    private final Environment environment;

    @PostConstruct
    void validate() {
        REQUIRED_PROPERTIES.forEach(this::requireSecretOrValue);

        String datasourceUrl = environment.getRequiredProperty("spring.datasource.url");
        String normalizedDatasource = datasourceUrl.toLowerCase(Locale.ROOT);
        if (!normalizedDatasource.startsWith("jdbc:mysql://")) {
            throw invalid("spring.datasource.url", "must use MySQL");
        }
        if (normalizedDatasource.contains("localhost") || normalizedDatasource.contains("127.0.0.1")) {
            throw invalid("spring.datasource.url", "must not target localhost in production");
        }
        if (normalizedDatasource.contains("usessl=false")) {
            throw invalid("spring.datasource.url", "must not disable TLS in production");
        }

        requireHttps("app.base-url", environment.getRequiredProperty("app.base-url"));
        Arrays.stream(environment.getRequiredProperty("app.cors.allowed-origins").split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .forEach(value -> requireHttps("app.cors.allowed-origins", value));

        String jwtKey = environment.getRequiredProperty("jwt.signerKey");
        if (jwtKey.length() < 64) {
            throw invalid("jwt.signerKey", "must contain at least 64 characters for HS512");
        }
        requireDistinct("security.otp.pepper", "jwt.signerKey");
        requireDistinct("security.registration.ip-pepper", "jwt.signerKey");
    }

    private void requireSecretOrValue(String property) {
        String value = environment.getProperty(property);
        if (value == null || value.isBlank()) {
            throw invalid(property, "is required");
        }
        String normalized = value.toUpperCase(Locale.ROOT);
        if (normalized.contains("CHANGE_ME") || normalized.contains("YOUR_")) {
            throw invalid(property, "still contains a placeholder value");
        }
    }

    private void requireHttps(String property, String value) {
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw invalid(property, "must be an absolute HTTPS URL");
            }
        } catch (IllegalArgumentException exception) {
            throw invalid(property, "must be an absolute HTTPS URL");
        }
    }

    private void requireDistinct(String property, String otherProperty) {
        if (environment.getRequiredProperty(property).equals(environment.getRequiredProperty(otherProperty))) {
            throw invalid(property, "must use a dedicated secret instead of reusing " + otherProperty);
        }
    }

    private IllegalStateException invalid(String property, String reason) {
        return new IllegalStateException("Invalid production configuration: " + property + " " + reason);
    }
}
