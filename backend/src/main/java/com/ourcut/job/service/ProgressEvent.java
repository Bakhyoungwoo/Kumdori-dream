package com.ourcut.job.service;

import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.ComposeJobStatus;

import java.time.Instant;
import java.util.UUID;

public record ProgressEvent(UUID eventId, UUID jobId, UUID userId, ComposeJobStatus status,
                            int progress, String errorCode, Instant updatedAt) {
    public static ProgressEvent from(ComposeJob job) {
        return new ProgressEvent(UUID.randomUUID(), job.getId(), job.getUser().getId(),
            job.getStatus(), job.getProgress(), job.getErrorCode(), job.getUpdatedAt());
    }
}
