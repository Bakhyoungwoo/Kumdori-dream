package com.ourcut.character.dto;

import com.ourcut.character.domain.FrameSlot;
import com.ourcut.global.storage.ObjectUrlResolver;

public record FrameSlotResponse(
    int slotIndex,
    String targetImageKey,
    String targetPreviewUrl,
    String analysis
) {
    public static FrameSlotResponse from(FrameSlot slot, ObjectUrlResolver urls) {
        return new FrameSlotResponse(slot.getSlotIndex(), slot.getTargetImageKey(), urls.resolve(slot.getTargetImageKey()), slot.getAnalysis());
    }
}
