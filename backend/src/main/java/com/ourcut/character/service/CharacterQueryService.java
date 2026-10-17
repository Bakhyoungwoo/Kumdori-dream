package com.ourcut.character.service;

import com.ourcut.character.dto.CharacterResponse;
import com.ourcut.character.repository.CharacterRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CharacterQueryService {
    private final CharacterRepository characters;

    public CharacterQueryService(CharacterRepository characters) {
        this.characters = characters;
    }

    public List<CharacterResponse> list() {
        return characters.findAll().stream().map(CharacterResponse::from).toList();
    }
}
