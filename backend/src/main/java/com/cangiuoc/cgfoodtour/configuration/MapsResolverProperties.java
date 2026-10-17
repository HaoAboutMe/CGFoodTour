package com.cangiuoc.cgfoodtour.configuration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "security.maps-resolver")
public class MapsResolverProperties {
    @Min(1)
    private int maximumConcurrentRequests = 10;
    @Min(1)
    private int maximumCacheEntries = 5_000;
    @NotNull
    private Duration successCacheTtl = Duration.ofMinutes(15);
    @NotNull
    private Duration negativeCacheTtl = Duration.ofMinutes(1);
}
