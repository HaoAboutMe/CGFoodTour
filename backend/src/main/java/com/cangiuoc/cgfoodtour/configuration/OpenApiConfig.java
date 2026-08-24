package com.cangiuoc.cgfoodtour.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

        private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

        @Bean
        public OpenAPI customOpenAPI() {
                Server devServer = new Server();
                devServer.setUrl("http://localhost:8080/api");
                devServer.setDescription("Development Server");

                Info info = new Info()
                                .title("CGFoodTour Identity & Authentication Service API")
                                .version("1.0.0")
                                .description("API documentation for CGFoodTour Identity & Authentication Service\n\n" +
                                                "Features:\n" +
                                                "• User Registration & Profile Management\n" +
                                                "• Authentication (JWT Login, Token Refresh, Introspect, Logout)\n" +
                                                "• Email Verification & Account Activation\n" +
                                                "• Password Reset (OTP via Email)\n" +
                                                "• Role-Based Access Control (RBAC) - Roles & Permissions");

                return new OpenAPI()
                                .info(info)
                                .servers(List.of(devServer))
                                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                                .components(new Components()
                                                .addSecuritySchemes(SECURITY_SCHEME_NAME, createSecurityScheme()));
        }

        private SecurityScheme createSecurityScheme() {
                return new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .in(SecurityScheme.In.HEADER)
                                .description("Enter JWT token (without 'Bearer' prefix)");
        }
}
