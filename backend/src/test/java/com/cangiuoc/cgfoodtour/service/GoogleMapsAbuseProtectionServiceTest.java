package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.MapsResolverProperties;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class GoogleMapsAbuseProtectionServiceTest {
    @Test
    void cachesResolutionButStillChargesEveryRequestToQuota() {
        AuthAbuseProtectionService abuse = mock(AuthAbuseProtectionService.class);
        MapsResolverProperties properties = new MapsResolverProperties();
        GoogleMapsAbuseProtectionService service = new GoogleMapsAbuseProtectionService(abuse, properties);
        AtomicInteger resolutions = new AtomicInteger();

        var first = service.resolve("user-1", "127.0.0.1", "https://maps.app.goo.gl/abc", () -> {
            resolutions.incrementAndGet();
            return Map.of("latitude", "10.1", "longitude", "106.2");
        });
        var second = service.resolve("user-1", "127.0.0.1", "https://maps.app.goo.gl/abc", () -> {
            resolutions.incrementAndGet();
            return Map.of();
        });

        assertThat(second).isEqualTo(first);
        assertThat(resolutions).hasValue(1);
        verify(abuse, times(2)).checkMapsResolutionAttempt("user-1", "127.0.0.1");
    }
}
