package com.cangiuoc.cgfoodtour.service;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseNotificationService {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final int maximumConnections;

    public SseNotificationService(MeterRegistry meterRegistry,
                                  @Value("${app.sse.maximum-connections:200}") int maximumConnections) {
        this.maximumConnections = maximumConnections;
        Gauge.builder("cgfoodtour.sse.connections", emitters, List::size)
                .description("Current number of open SSE connections")
                .register(meterRegistry);
    }

    public synchronized SseEmitter subscribe() {
        if (emitters.size() >= maximumConnections) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many active event-stream connections");
        }
        // Set timeout to 10 minutes (600,000 milliseconds)
        SseEmitter emitter = new SseEmitter(600_000L);

        // Send an initial event to establish connection successfully
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected successfully"));
        } catch (IOException e) {
            log.warn("Failed to establish SSE connection");
            emitter.completeWithError(e);
            return emitter;
        }

        emitters.add(emitter);

        emitter.onCompletion(() -> {
            log.info("SSE connection completed, removing emitter");
            emitters.remove(emitter);
        });

        emitter.onTimeout(() -> {
            log.info("SSE connection timed out, removing emitter");
            emitters.remove(emitter);
        });

        emitter.onError((ex) -> {
            log.error("SSE connection error, removing emitter", ex);
            emitters.remove(emitter);
        });

        return emitter;
    }

    public void broadcast(String data) {
        log.info("Broadcasting SSE event to {} subscribers", emitters.size());
        sendEvent("message", data);
    }

    @Scheduled(fixedDelayString = "${app.sse.heartbeat-delay-ms:30000}")
    public void heartbeat() {
        sendEvent("heartbeat", "keep-alive");
    }

    private void sendEvent(String eventName, String data) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException | IllegalStateException e) {
                log.debug("Removing a closed SSE emitter after send failure");
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
        }
    }
}
