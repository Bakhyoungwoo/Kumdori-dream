package com.ourcut.job.repository;
import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.ComposeJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ComposeJobRepository extends JpaRepository<ComposeJob, UUID> {
    Optional<ComposeJob> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
    List<ComposeJob> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<ComposeJob> findByUserIdAndStatusOrderByFinishedAtDesc(UUID userId, ComposeJobStatus status);
}
