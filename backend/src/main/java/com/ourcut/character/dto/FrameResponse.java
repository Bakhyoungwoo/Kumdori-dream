package com.ourcut.character.dto;

import com.ourcut.character.domain.Frame;
import com.ourcut.global.storage.ObjectUrlResolver;
import java.util.List;
import java.util.UUID;

public record FrameResponse(
    UUID id,
    String title,
    String description,
    UUID characterId,
    String characterName,
    String characterProfileImageKey,
    String characterProfileImageUrl,
    String source,
    String templateKey,
    String templatePreviewUrl,
    int slotCount,
    long usageCount,
    List<FrameSlotResponse> slots
) {
    public FrameResponse(UUID id, String title, String description, UUID characterId, String characterName,
                         String source, int slotCount, long usageCount) {
        this(id, title, description, characterId, characterName, null, null, source, null, null, slotCount, usageCount, List.of());
    }

    public static FrameResponse from(Frame frame, ObjectUrlResolver urls) {
        var character = frame.getCharacter();
        return new FrameResponse(
            frame.getId(),
            frame.getTitle(),
            frame.getDescription(),
            character == null ? null : character.getId(),
            character == null ? null : character.getName(),
            character == null ? null : character.getProfileImageKey(),
            character == null ? null : urls.resolve(character.getProfileImageKey()),
            frame.getSourceType().name(),
            frame.getTemplateKey(),
            urls.resolve(frame.getTemplateKey()),
            frame.getSlotCount(),
            frame.getUsageCount(),
            frame.getSlots().stream().map(slot -> FrameSlotResponse.from(slot, urls)).toList()
        );
    }
}
