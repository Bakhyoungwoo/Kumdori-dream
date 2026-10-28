package com.ourcut.job.dto;

import java.util.UUID;

public final class GalleryDtos {
    private GalleryDtos() {}

    public record Item(
        UUID jobId,
        UUID frameId,
        String resultKey,
        String thumbnailKey,
        String resultPreviewUrl,
        String thumbnailPreviewUrl,
        String createdAt
    ) {}

    public record PageResponse(java.util.List<Item> items, String nextCursor) {}
}
