package com.ourcut.job.dto;

import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.ComposeJobStatus;
import com.ourcut.job.domain.PipelineType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class JobDtos {
    private JobDtos() {}

    public record CreateJobRequest(
        @NotNull UUID frameId,
        @NotNull PipelineType pipelineType,
        @Size(max = 200) String requirementText,
        @Min(1) @Max(4) Integer imageCount,
        @NotEmpty @Size(max = 4) List<@Valid Input> inputs
    ) {
        public int resolvedImageCount() {
            return imageCount == null ? 1 : imageCount;
        }
        public String normalizedRequirementText() {
            return requirementText == null || requirementText.isBlank() ? null : requirementText.trim();
        }
    }

    public record Input(
        @Min(0) int slotIndex,
        @NotBlank @Size(max = 500) String userImageKey
    ) {}

    public record JobResponse(
        UUID id,
        UUID frameId,
        ComposeJobStatus status,
        PipelineType pipelineType,
        String requirementText,
        int imageCount,
        int progress,
        String errorCode,
        Instant createdAt,
        Instant updatedAt
    ) {
        public static JobResponse from(ComposeJob job) {
            return new JobResponse(
                job.getId(), job.getFrame().getId(), job.getStatus(), job.getPipelineType(),
                job.getRequirementText(), job.getImageCount(), job.getProgress(), job.getErrorCode(),
                job.getCreatedAt(), job.getUpdatedAt());
        }
    }
}
