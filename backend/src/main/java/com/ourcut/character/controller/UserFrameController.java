package com.ourcut.character.controller;

import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.dto.UserFrameDtos;
import com.ourcut.character.service.UserFrameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user-frames")
public class UserFrameController {
    private final UserFrameService frames;

    public UserFrameController(UserFrameService frames) { this.frames = frames; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FrameResponse create(@AuthenticationPrincipal UUID userId,
                                @Valid @RequestBody UserFrameDtos.CreateRequest request) {
        return frames.create(userId, request);
    }

    @GetMapping
    public List<FrameResponse> list(@AuthenticationPrincipal UUID userId) {
        return frames.list(userId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        frames.delete(userId, id);
    }
}
