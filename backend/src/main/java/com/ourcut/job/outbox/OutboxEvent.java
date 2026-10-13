package com.ourcut.job.outbox;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id private UUID id;
    @Column(name = "aggregate_id", nullable = false) private UUID aggregateId;
    @Column(name = "event_type", nullable = false, length = 100) private String eventType;
    @Column(nullable = false, columnDefinition = "jsonb") private String payload;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private OutboxStatus status = OutboxStatus.PENDING;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column private Instant publishedAt;
    protected OutboxEvent() {}
    public OutboxEvent(UUID aggregateId, String eventType, String payload) { this.id = UUID.randomUUID(); this.aggregateId = aggregateId; this.eventType = eventType; this.payload = payload; this.createdAt = Instant.now(); }
    public void markPublished() { status = OutboxStatus.PUBLISHED; publishedAt = Instant.now(); }
    public void markFailed() { status = OutboxStatus.FAILED; }
    public UUID getId() { return id; }
    public UUID getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public OutboxStatus getStatus() { return status; }
}
