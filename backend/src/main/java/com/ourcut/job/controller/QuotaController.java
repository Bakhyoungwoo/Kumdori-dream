package com.ourcut.job.controller;

import com.ourcut.job.dto.QuotaDtos;
import com.ourcut.job.service.GenerationQuotaService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/me/quota")
public class QuotaController {
    private final GenerationQuotaService quota;

    public QuotaController(GenerationQuotaService quota) {
        this.quota = quota;
    }

    @GetMapping
    public QuotaDtos.Response get(@AuthenticationPrincipal UUID userId) {
        return quota.get(userId);
    }
}
