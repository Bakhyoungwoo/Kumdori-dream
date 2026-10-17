package com.ourcut.job.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourcut.character.domain.Frame;
import com.ourcut.character.repository.FrameRepository;
import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.PipelineType;
import com.ourcut.job.dto.JobDtos;
import com.ourcut.job.outbox.OutboxEvent;
import com.ourcut.job.outbox.OutboxEventRepository;
import com.ourcut.job.repository.ComposeJobRepository;
import com.ourcut.user.domain.User;
import com.ourcut.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
public class ComposeJobService {
    private final ComposeJobRepository jobs;
    private final OutboxEventRepository outbox;
    private final UserRepository users;
    private final FrameRepository frames;
    private final ObjectMapper objectMapper;

    public ComposeJobService(ComposeJobRepository jobs, OutboxEventRepository outbox,
                             UserRepository users, FrameRepository frames, ObjectMapper objectMapper) {
        this.jobs = jobs;
        this.outbox = outbox;
        this.users = users;
        this.frames = frames;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public JobDtos.JobResponse create(UUID userId, String idempotencyKey, JobDtos.CreateJobRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key is required");
        }

        var existing = jobs.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
        if (existing.isPresent()) return JobDtos.JobResponse.from(existing.get());

        User user = users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Frame frame = frames.findById(request.frameId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Frame not found"));

        validateRequest(request, frame);

        String requirementText = request.normalizedRequirementText();
        ComposeJob job = jobs.save(new ComposeJob(
            user, frame, request.pipelineType(), requirementText,
            request.resolvedImageCount(), idempotencyKey));
        request.inputs().forEach(input -> job.addInput(input.slotIndex(), input.userImageKey().trim()));

        outbox.save(new OutboxEvent(job.getId(), "COMPOSE_REQUESTED", payload(job, request)));
        return JobDtos.JobResponse.from(job);
    }

    @Transactional(readOnly = true)
    public JobDtos.JobResponse get(UUID userId, UUID jobId) {
        ComposeJob job = jobs.findById(jobId)
            .filter(value -> value.getUser().getId().equals(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        return JobDtos.JobResponse.from(job);
    }

    @Transactional(readOnly = true)
    public List<JobDtos.JobResponse> list(UUID userId) {
        return jobs.findByUserIdOrderByCreatedAtDesc(userId).stream().map(JobDtos.JobResponse::from).toList();
    }

    @Transactional
    public void cancel(UUID userId, UUID jobId) {
        ComposeJob job = ownedJob(userId, jobId);
        job.cancel();
    }

    @Transactional
    public JobDtos.JobResponse callback(UUID jobId, JobDtos.JobCallbackRequest request) {
        ComposeJob job = jobs.findById(jobId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        if (job.getStatus() == com.ourcut.job.domain.ComposeJobStatus.DONE
            || job.getStatus() == com.ourcut.job.domain.ComposeJobStatus.FAILED
            || job.getStatus() == com.ourcut.job.domain.ComposeJobStatus.CANCELED) {
            return JobDtos.JobResponse.from(job);
        }
        if (request.status() == com.ourcut.job.domain.ComposeJobStatus.DONE) {
            if (request.results() == null || request.results().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed jobs require results");
            }
            request.results().forEach(result -> job.addResult(result.variantIndex(), result.resultKey().trim(),
                result.thumbnailKey() == null ? null : result.thumbnailKey().trim(), result.width(), result.height()));
            job.complete();
        } else if (request.status() == com.ourcut.job.domain.ComposeJobStatus.FAILED) {
            job.fail(request.errorCode() == null ? "COMPOSE_FAILED" : request.errorCode().trim());
        } else if (request.status() == com.ourcut.job.domain.ComposeJobStatus.PROCESSING) {
            job.start();
            if (request.progress() != null) job.updateProgress(request.progress());
        } else if (request.status() == com.ourcut.job.domain.ComposeJobStatus.QUEUED) {
            job.queue();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported callback status");
        }
        return JobDtos.JobResponse.from(job);
    }

    private ComposeJob ownedJob(UUID userId, UUID jobId) {
        return jobs.findById(jobId)
            .filter(value -> value.getUser().getId().equals(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
    }

    private void validateRequest(JobDtos.CreateJobRequest request, Frame frame) {
        String requirement = request.normalizedRequirementText();
        if (request.pipelineType() == PipelineType.CV && (requirement != null || request.resolvedImageCount() != 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CV jobs require no requirement and one image");
        }
        if (request.pipelineType() == PipelineType.GENERATIVE && requirement == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generative jobs require a requirement");
        }
        if (request.inputs().size() != frame.getSlotCount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All frame slots must have an input");
        }
        var slots = request.inputs().stream().map(JobDtos.Input::slotIndex).toList();
        if (new HashSet<>(slots).size() != slots.size()
            || slots.stream().anyMatch(index -> index < 0 || index >= frame.getSlotCount())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid frame slot inputs");
        }
    }

    private String payload(ComposeJob job, JobDtos.CreateJobRequest request) {
        try {
            return objectMapper.writeValueAsString(new ComposeRequestPayload(
                job.getId(), job.getUser().getId(), job.getFrame().getId(), job.getPipelineType(),
                job.getRequirementText(), job.getImageCount(), request.inputs()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize compose request", exception);
        }
    }

    private record ComposeRequestPayload(UUID jobId, UUID userId, UUID frameId, PipelineType pipelineType,
                                         String requirementText, int imageCount, Object inputs) {}
}
