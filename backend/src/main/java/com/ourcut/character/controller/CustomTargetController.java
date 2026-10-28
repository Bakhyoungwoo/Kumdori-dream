package com.ourcut.character.controller;

import com.ourcut.character.dto.CustomTargetDtos;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.service.CustomTargetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/custom-targets")
public class CustomTargetController {
    private final CustomTargetService targets;

    public CustomTargetController(CustomTargetService targets) {
        this.targets = targets;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FrameResponse create(@AuthenticationPrincipal UUID userId,
                                @Valid @RequestBody CustomTargetDtos.CreateRequest request) {
        return targets.create(userId, request);
    }

    @GetMapping
    public List<FrameResponse> list(@AuthenticationPrincipal UUID userId) {
        return targets.list(userId);
    }
}
