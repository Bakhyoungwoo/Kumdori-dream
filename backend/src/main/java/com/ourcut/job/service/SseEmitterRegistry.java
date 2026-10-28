package com.ourcut.job.service;

import com.ourcut.job.dto.JobDtos;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SseEmitterRegistry {
    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public void register(UUID jobId, SseEmitter emitter) {
        emitters.computeIfAbsent(jobId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        Runnable cleanup = () -> remove(jobId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ignored -> cleanup.run());
    }

    public void remove(UUID jobId, SseEmitter emitter) {
        var jobEmitters = emitters.get(jobId);
        if (jobEmitters == null) return;
        jobEmitters.remove(emitter);
        if (jobEmitters.isEmpty()) emitters.remove(jobId, jobEmitters);
    }

    public void sendSnapshot(SseEmitter emitter, JobDtos.JobResponse snapshot) {
        send(emitter, "snapshot-" + snapshot.updatedAt().toEpochMilli(), snapshot);
    }

    public void broadcast(ProgressEvent event, JobDtos.JobResponse snapshot) {
        var jobEmitters = emitters.get(event.jobId());
        if (jobEmitters == null) return;
        for (SseEmitter emitter : jobEmitters) send(emitter, event.eventId().toString(), snapshot);
    }

    private void send(SseEmitter emitter, String eventId, JobDtos.JobResponse payload) {
        try {
            emitter.send(SseEmitter.event().id(eventId).name("progress").data(payload, MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException exception) {
            // Completion callbacks remove dead emitters from the registry.
        }
    }
}
