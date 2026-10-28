package com.ourcut.job.repository;
import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.ComposeJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ComposeJobRepository extends JpaRepository<ComposeJob, UUID> {
    Optional<ComposeJob> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select job from ComposeJob job where job.id = :jobId")
    Optional<ComposeJob> findByIdForUpdate(@Param("jobId") UUID jobId);
    List<ComposeJob> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<ComposeJob> findByUserIdAndStatusOrderByFinishedAtDesc(UUID userId, ComposeJobStatus status);
    List<ComposeJob> findByUserIdAndStatusOrderByFinishedAtDesc(UUID userId, ComposeJobStatus status, Pageable pageable);
    List<ComposeJob> findByUserIdAndStatusAndFinishedAtBeforeOrderByFinishedAtDesc(UUID userId, ComposeJobStatus status, java.time.Instant before, Pageable pageable);
    List<ComposeJob> findByStatusInAndUpdatedAtBefore(List<ComposeJobStatus> statuses, java.time.Instant cutoff);
}
