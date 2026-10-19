package com.cangiuoc.cgfoodtour.service;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SseNotificationServiceTest {
    @Test
    void rejectsConnectionsAboveConfiguredSingleInstanceCapacity() {
        var service = new SseNotificationService(new SimpleMeterRegistry(), 1);

        service.subscribe();

        assertThrows(ResponseStatusException.class, service::subscribe);
    }

    @Test
    void heartbeatIsSafeWithoutSubscribers() {
        var service = new SseNotificationService(new SimpleMeterRegistry(), 1);

        assertDoesNotThrow(service::heartbeat);
    }
}
