package com.ourcut.job.service;

import com.ourcut.job.domain.ComposeJobStatus;
import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.repository.ComposeJobRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class ComposeJobTimeoutScheduler {
    private final ComposeJobRepository jobs;
    private final long timeoutSeconds;

    public ComposeJobTimeoutScheduler(ComposeJobRepository jobs,
                                      @Value("${app.jobs.timeout-seconds}") long timeoutSeconds) {
        this.jobs = jobs;
        this.timeoutSeconds = timeoutSeconds;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-ms}")
    @Transactional
    public void failStalledJobs() {
        Instant cutoff = Instant.now().minusSeconds(timeoutSeconds);
        jobs.findByStatusInAndUpdatedAtBefore(
            List.of(ComposeJobStatus.QUEUED, ComposeJobStatus.PROCESSING), cutoff)
            .forEach(ComposeJob::timeout);
    }
}
