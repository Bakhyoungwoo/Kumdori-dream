package com.ourcut.character.dto;

import com.ourcut.character.domain.Frame;
import java.util.UUID;

public record FrameResponse(
    UUID id,
    String title,
    String description,
    UUID characterId,
    String characterName,
    String source,
    int slotCount,
    long usageCount
) {
    public static FrameResponse from(Frame frame) {
        var character = frame.getCharacter();
        return new FrameResponse(
            frame.getId(),
            frame.getTitle(),
            frame.getDescription(),
            character == null ? null : character.getId(),
            character == null ? null : character.getName(),
            frame.getSourceType().name(),
            frame.getSlotCount(),
            frame.getUsageCount()
        );
    }
}
