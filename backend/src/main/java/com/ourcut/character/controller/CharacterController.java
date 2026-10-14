package com.ourcut.character.controller;

import com.ourcut.character.dto.CharacterResponse;
import com.ourcut.character.service.CharacterQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/characters")
public class CharacterController {
    private final CharacterQueryService characters;

    public CharacterController(CharacterQueryService characters) {
        this.characters = characters;
    }

    @GetMapping
    public List<CharacterResponse> list() {
        return characters.list();
    }
}
