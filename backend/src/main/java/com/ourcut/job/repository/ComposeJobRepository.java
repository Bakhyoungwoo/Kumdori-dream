package com.ourcut.job.repository;
import com.ourcut.job.domain.ComposeJob;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ComposeJobRepository extends JpaRepository<ComposeJob, UUID> {
    Optional<ComposeJob> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
}
