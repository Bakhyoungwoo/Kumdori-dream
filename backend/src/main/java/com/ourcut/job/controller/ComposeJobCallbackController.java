package com.ourcut.job.controller;

import com.ourcut.job.dto.JobDtos;
import com.ourcut.job.service.ComposeJobService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internal/jobs")
public class ComposeJobCallbackController {
    private final ComposeJobService jobs;
    private final String internalApiKey;

    public ComposeJobCallbackController(ComposeJobService jobs,
                                        @Value("${app.internal-api-key:}") String internalApiKey) {
        this.jobs = jobs;
        this.internalApiKey = internalApiKey;
    }

    @PostMapping("/{id}/callback")
    public JobDtos.JobResponse callback(@RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
                                        @PathVariable UUID id,
                                        @Valid @RequestBody JobDtos.JobCallbackRequest request) {
        if (internalApiKey.isBlank() || apiKey == null || !internalApiKey.equals(apiKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API key");
        }
        return jobs.callback(id, request);
    }
}
