package com.ourcut.job.controller;

import com.ourcut.job.dto.GalleryDtos;
import com.ourcut.job.service.ComposeJobService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gallery")
public class GalleryController {
    private final ComposeJobService jobs;

    public GalleryController(ComposeJobService jobs) { this.jobs = jobs; }

    @GetMapping
    public List<GalleryDtos.Item> list(@AuthenticationPrincipal UUID userId) {
        return jobs.gallery(userId);
    }
}
