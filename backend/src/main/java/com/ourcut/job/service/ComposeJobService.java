package com.ourcut.job.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourcut.character.domain.Frame;
import com.ourcut.character.repository.FrameRepository;
import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.PipelineType;
import com.ourcut.job.domain.MediaType;
import com.ourcut.job.dto.JobDtos;
import com.ourcut.job.outbox.OutboxEvent;
import com.ourcut.job.outbox.OutboxEventRepository;
import com.ourcut.job.repository.ComposeJobRepository;
import com.ourcut.user.domain.User;
import com.ourcut.user.repository.UserRepository;
import com.ourcut.global.storage.ObjectUrlResolver;
import org.springframework.http.HttpStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import java.time.Instant;
import com.ourcut.job.dto.GalleryDtos;

@Service
public class ComposeJobService {
    private final ComposeJobRepository jobs;
    private final OutboxEventRepository outbox;
    private final UserRepository users;
    private final FrameRepository frames;
    private final ObjectMapper objectMapper;
    private final ObjectUrlResolver urls;
    private final ApplicationEventPublisher eventPublisher;
    private final GenerationQuotaService quota;

    public ComposeJobService(ComposeJobRepository jobs, OutboxEventRepository outbox,
                             UserRepository users, FrameRepository frames, ObjectMapper objectMapper,
                             ObjectUrlResolver urls, ApplicationEventPublisher eventPublisher,
                             GenerationQuotaService quota) {
        this.jobs = jobs;
        this.outbox = outbox;
        this.users = users;
        this.frames = frames;
        this.objectMapper = objectMapper;
        this.urls = urls;
        this.eventPublisher = eventPublisher;
        this.quota = quota;
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
        Frame frame = request.frameId() == null ? null : frames.findById(request.frameId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Frame not found"));

        validateRequest(userId, request, frame);
        quota.reserve(userId, request);

        String requirementText = request.normalizedRequirementText();
        ComposeJob job = jobs.save(new ComposeJob(
            user, frame, request.pipelineType(), request.resolvedMediaType(), requirementText,
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

    @Transactional(readOnly = true)
    public List<GalleryDtos.Item> gallery(UUID userId) {
        return jobs.findByUserIdAndStatusOrderByFinishedAtDesc(userId, com.ourcut.job.domain.ComposeJobStatus.DONE)
            .stream()
            .flatMap(job -> job.getResults().stream().map(result -> new GalleryDtos.Item(
                job.getId(), job.getFrame() == null ? null : job.getFrame().getId(), result.getResultKey(), result.getThumbnailKey(),
                urls.resolve(result.getResultKey()), urls.resolve(result.getThumbnailKey()),
                job.getFinishedAt() == null ? null : job.getFinishedAt().toString())))
            .toList();
    }

    @Transactional(readOnly = true)
    public GalleryDtos.PageResponse galleryPage(UUID userId, int limit, String before) {
        int pageSize = Math.max(1, Math.min(limit, 50));
        Instant cursor = before == null || before.isBlank() ? null : Instant.parse(before);
        var jobsPage = cursor == null
            ? jobs.findByUserIdAndStatusOrderByFinishedAtDesc(userId, com.ourcut.job.domain.ComposeJobStatus.DONE, PageRequest.of(0, pageSize + 1))
            : jobs.findByUserIdAndStatusAndFinishedAtBeforeOrderByFinishedAtDesc(userId, com.ourcut.job.domain.ComposeJobStatus.DONE, cursor, PageRequest.of(0, pageSize + 1));
        boolean hasNext = jobsPage.size() > pageSize;
        var items = jobsPage.stream().limit(pageSize).flatMap(job -> job.getResults().stream().map(result -> new GalleryDtos.Item(
            job.getId(), job.getFrame() == null ? null : job.getFrame().getId(), result.getResultKey(), result.getThumbnailKey(),
            urls.resolve(result.getResultKey()), urls.resolve(result.getThumbnailKey()),
            job.getFinishedAt() == null ? null : job.getFinishedAt().toString()))).toList();
        String next = hasNext && !jobsPage.isEmpty() ? jobsPage.get(pageSize).getFinishedAt().toString() : null;
        return new GalleryDtos.PageResponse(items, next);
    }

    @Transactional
    public void cancel(UUID userId, UUID jobId) {
        ComposeJob job = ownedJob(userId, jobId);
        job.cancel();
        eventPublisher.publishEvent(ProgressEvent.from(job));
    }

    @Transactional
    public JobDtos.JobResponse callback(UUID jobId, JobDtos.JobCallbackRequest request) {
        ComposeJob job = jobs.findByIdForUpdate(jobId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        if (job.getStatus() == com.ourcut.job.domain.ComposeJobStatus.DONE
            || job.getStatus() == com.ourcut.job.domain.ComposeJobStatus.FAILED
            || job.getStatus() == com.ourcut.job.domain.ComposeJobStatus.ENGINE_TIMEOUT
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
        eventPublisher.publishEvent(ProgressEvent.from(job));
        return JobDtos.JobResponse.from(job);
    }

    private ComposeJob ownedJob(UUID userId, UUID jobId) {
        return jobs.findById(jobId)
            .filter(value -> value.getUser().getId().equals(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
    }

    private void validateRequest(UUID userId, JobDtos.CreateJobRequest request, Frame frame) {
        if (frame != null) {
            boolean officialFrame = frame.getSourceType() == com.ourcut.character.domain.FrameSourceType.CHARACTER
                && frame.getCharacter() != null && frame.getOwner() == null;
            boolean ownedCustomFrame = frame.getSourceType() == com.ourcut.character.domain.FrameSourceType.USER_UPLOADED
                && frame.getOwner() != null && frame.getOwner().getId().equals(userId)
                && frame.getCharacter() == null;
            if (!officialFrame && !ownedCustomFrame) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Frame not found");
            }
        }
        String requirement = request.normalizedRequirementText();
        if (request.resolvedMediaType() == MediaType.VIDEO && request.pipelineType() != PipelineType.GENERATIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video jobs require the generative pipeline");
        }
        if (request.pipelineType() == PipelineType.CV && (requirement != null || request.resolvedImageCount() != 1)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CV jobs require no requirement and one image");
        }
        if (request.pipelineType() == PipelineType.GENERATIVE && requirement == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generative jobs require a requirement");
        }
        if (request.pipelineType() == PipelineType.GENERATIVE && request.inputs().size() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Generative jobs accept at most two reference images");
        }
        if (frame != null && request.pipelineType() == PipelineType.GENERATIVE && request.inputs().size() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Framed generation requires a user image and a character image");
        }
        if (frame == null && request.pipelineType() == PipelineType.CV && request.inputs().size() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Frame-free CV jobs require one input");
        }
        if (frame != null && request.pipelineType() == PipelineType.CV
            && request.inputs().size() != frame.getSlotCount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All frame slots must have an input");
        }
        var slots = request.inputs().stream().map(JobDtos.Input::slotIndex).toList();
        if (new HashSet<>(slots).size() != slots.size()
            || slots.stream().anyMatch(index -> index < 0 || (frame != null && index >= frame.getSlotCount()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid frame slot inputs");
        }
        String expectedPrefix = "users/" + userId + "/inputs/";
        String characterImageKey = frame == null || frame.getCharacter() == null
            ? null : frame.getCharacter().getProfileImageKey();
        var referenceKeys = request.inputs().stream().map(JobDtos.Input::userImageKey).map(String::trim).toList();
        if (referenceKeys.stream().anyMatch(key -> !key.startsWith(expectedPrefix)
            && !(request.pipelineType() == PipelineType.GENERATIVE && key.equals(characterImageKey)))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reference image is not available to the user");
        }
        if (frame != null && request.pipelineType() == PipelineType.GENERATIVE
            && (referenceKeys.stream().noneMatch(key -> key.startsWith(expectedPrefix))
                || characterImageKey == null || !referenceKeys.contains(characterImageKey))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Framed generation requires a user image and a character image");
        }
    }

    private String payload(ComposeJob job, JobDtos.CreateJobRequest request) {
        try {
            return objectMapper.writeValueAsString(new ComposeRequestPayload(
                job.getId(), job.getUser().getId(), job.getFrame() == null ? null : job.getFrame().getId(),
                job.getFrame() == null ? null : job.getFrame().getSlotCount(), job.getPipelineType(), job.getMediaType(),
                job.getRequirementText(), job.getImageCount(), request.inputs(),
                job.getFrame() == null ? null : job.getFrame().getTemplateKey(),
                job.getFrame() == null || job.getFrame().getCharacter() == null ? null : job.getFrame().getCharacter().getProfileImageKey()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize compose request", exception);
        }
    }

    private record ComposeRequestPayload(UUID jobId, UUID userId, UUID frameId, Integer frameSlotCount, PipelineType pipelineType,
                                         MediaType mediaType, String requirementText, int imageCount, Object inputs,
                                         String frameKey, String characterImageKey) {}
}
