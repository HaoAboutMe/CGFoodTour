package com.cangiuoc.cgfoodtour.configuration;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "app.admin")
public class AdminBootstrapProperties {
    @NotBlank
    @Email
    private String defaultEmail = "haoaboutme@gmail.com";

    private String defaultPassword = "";
}
