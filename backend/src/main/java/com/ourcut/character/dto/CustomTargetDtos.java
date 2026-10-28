package com.ourcut.character.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class CustomTargetDtos {
    private CustomTargetDtos() {}

    public record CreateRequest(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 500) String description,
        @NotBlank @Size(max = 500) String templateKey,
        @NotNull @Size(min = 1, max = 4) List<@Valid Slot> slots
    ) {}

    public record Slot(
        int slotIndex,
        @NotBlank @Size(max = 500) String targetImageKey,
        @Size(max = 2000) String analysis
    ) {}
}
