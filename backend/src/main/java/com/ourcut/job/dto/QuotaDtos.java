package com.ourcut.job.dto;

public final class QuotaDtos {
    private QuotaDtos() {}

    public record Response(
        long dailyLimit,
        long dailyUsed,
        long dailyRemaining,
        long globalLimit,
        long globalUsed,
        long globalRemaining,
        String date
    ) {}
}
