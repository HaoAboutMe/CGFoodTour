package com.cangiuoc.cgfoodtour.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class SseNotificationService {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        // Set timeout to 10 minutes (600,000 milliseconds)
        SseEmitter emitter = new SseEmitter(600_000L);

        // Send an initial event to establish connection successfully
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected successfully"));
        } catch (IOException e) {
            log.error("Failed to send initial SSE event", e);
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
        log.info("Broadcasting SSE event: {} to {} subscribers", data, emitters.size());
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(data));
            } catch (IOException | IllegalStateException e) {
                log.warn("Failed to send broadcast event, marking emitter as dead", e);
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
        }
    }
}
