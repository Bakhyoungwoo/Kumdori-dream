package com.ourcut.job.controller;

import com.ourcut.job.service.ComposeJobService;
import com.ourcut.job.service.SseEmitterRegistry;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
public class ComposeJobStreamController {
    private final ComposeJobService jobs;
    private final SseEmitterRegistry registry;

    public ComposeJobStreamController(ComposeJobService jobs, SseEmitterRegistry registry) {
        this.jobs = jobs;
        this.registry = registry;
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UUID userId, @PathVariable UUID id,
                             @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId) {
        var snapshot = jobs.get(userId, id);
        var emitter = new SseEmitter(30 * 60_000L);
        registry.register(id, emitter);
        // Pub/Sub is ephemeral, so every initial connection and reconnect starts with a durable DB snapshot.
        registry.sendSnapshot(emitter, snapshot);
        return emitter;
    }
}
