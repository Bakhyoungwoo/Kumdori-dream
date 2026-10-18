package com.ourcut.character.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public final class UserFrameDtos {
    private UserFrameDtos() {}

    public record CreateRequest(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 500) String description,
        @NotBlank @Size(max = 500) String templateKey,
        @Min(1) @Max(4) int slotCount,
        @NotEmpty @Size(max = 4) List<@Valid Slot> slots
    ) {}

    public record Slot(
        @Min(0) int slotIndex,
        @NotBlank @Size(max = 500) String targetImageKey,
        @Size(max = 2000) String analysis
    ) {}
}
