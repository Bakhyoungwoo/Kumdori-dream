package com.ourcut.character.controller;

import com.ourcut.character.domain.FrameSourceType;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.service.FrameQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/frames")
public class FrameController {
    private final FrameQueryService frames;

    public FrameController(FrameQueryService frames) {
        this.frames = frames;
    }

    @GetMapping
    public List<FrameResponse> list(
        @RequestParam(defaultValue = "CHARACTER") FrameSourceType source,
        @RequestParam(required = false) UUID characterId
    ) {
        return frames.list(source, characterId);
    }
}
