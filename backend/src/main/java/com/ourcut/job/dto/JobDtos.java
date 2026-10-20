package com.ourcut.job.dto;

import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.ComposeJobStatus;
import com.ourcut.job.domain.PipelineType;
import com.ourcut.job.domain.MediaType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class JobDtos {
    private JobDtos() {}

    public record CreateJobRequest(
        UUID frameId,
        @NotNull PipelineType pipelineType,
        MediaType mediaType,
        @Size(max = 200) String requirementText,
        @Min(1) @Max(4) Integer imageCount,
        @NotNull @Size(max = 4) List<@Valid Input> inputs
    ) {
        public int resolvedImageCount() {
            return imageCount == null ? 1 : imageCount;
        }
        public String normalizedRequirementText() {
            return requirementText == null || requirementText.isBlank() ? null : requirementText.trim();
        }
        public MediaType resolvedMediaType() { return mediaType == null ? MediaType.IMAGE : mediaType; }
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
        MediaType mediaType,
        String requirementText,
        int imageCount,
        int progress,
        String errorCode,
        List<ResultResponse> results,
        Instant createdAt,
        Instant updatedAt
    ) {
        public static JobResponse from(ComposeJob job) {
            return new JobResponse(
                job.getId(), job.getFrame() == null ? null : job.getFrame().getId(), job.getStatus(), job.getPipelineType(), job.getMediaType(),
                job.getRequirementText(), job.getImageCount(), job.getProgress(), job.getErrorCode(),
                job.getResults().stream().map(ResultResponse::from).toList(),
                job.getCreatedAt(), job.getUpdatedAt());
        }
    }

    public record ResultResponse(String resultKey, String thumbnailKey, Integer width, Integer height) {
        static ResultResponse from(com.ourcut.job.domain.ComposeResult result) {
            return new ResultResponse(result.getResultKey(), result.getThumbnailKey(), result.getWidth(), result.getHeight());
        }
    }

    public record ResultItem(
        @Min(0) @Max(3) int variantIndex,
        @NotBlank @Size(max = 500) String resultKey,
        @Size(max = 500) String thumbnailKey,
        @Min(1) Integer width,
        @Min(1) Integer height
    ) {}

    public record JobCallbackRequest(
        @NotNull ComposeJobStatus status,
        @Min(0) @Max(100) Integer progress,
        @Size(max = 100) String errorCode,
        @Size(max = 4) List<@Valid ResultItem> results
    ) {}
}
