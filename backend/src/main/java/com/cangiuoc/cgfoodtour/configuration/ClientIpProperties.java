package com.cangiuoc.cgfoodtour.configuration;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "security.client-ip")
public class ClientIpProperties {
    private boolean trustForwardedHeaders = false;
    private List<String> trustedProxies = new ArrayList<>();

    @Min(1)
    @Max(20)
    private int maximumForwardedHops = 5;
}
