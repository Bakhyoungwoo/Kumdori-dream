package com.ourcut.job.controller;

import com.ourcut.job.dto.JobDtos;
import com.ourcut.job.service.ComposeJobService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
public class ComposeJobController {
    private final ComposeJobService jobs;

    public ComposeJobController(ComposeJobService jobs) {
        this.jobs = jobs;
    }

    @PostMapping
    public ResponseEntity<JobDtos.JobResponse> create(
        @AuthenticationPrincipal UUID userId,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody JobDtos.CreateJobRequest request
    ) {
        var response = jobs.create(userId, idempotencyKey, request);
        return ResponseEntity.created(URI.create("/api/v1/jobs/" + response.id())).body(response);
    }

    @GetMapping("/{id}")
    public JobDtos.JobResponse get(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return jobs.get(userId, id);
    }

    @GetMapping
    public java.util.List<JobDtos.JobResponse> list(@AuthenticationPrincipal UUID userId) {
        return jobs.list(userId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        jobs.cancel(userId, id);
    }
}
