package com.ourcut.job.outbox;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.*;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {
    @Query("""
        select event from OutboxEvent event
        where event.status = :status
          and event.availableAt <= CURRENT_TIMESTAMP
        order by event.createdAt asc
        """)
    List<OutboxEvent> findReadyByStatus(OutboxStatus status, Pageable pageable);
}
