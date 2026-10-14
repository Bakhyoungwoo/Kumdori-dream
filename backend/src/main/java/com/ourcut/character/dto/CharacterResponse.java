package com.ourcut.character.dto;

import com.ourcut.character.domain.Character;
import java.util.UUID;

public record CharacterResponse(UUID id, String name, String profileImageKey) {
    public static CharacterResponse from(Character character) {
        return new CharacterResponse(character.getId(), character.getName(), character.getProfileImageKey());
    }
}
