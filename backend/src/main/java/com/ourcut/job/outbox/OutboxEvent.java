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
    @Column(name = "retry_count", nullable = false) private int retryCount;
    @Column(name = "available_at", nullable = false) private Instant availableAt;
    @Column(name = "last_error", length = 500) private String lastError;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column private Instant publishedAt;
    protected OutboxEvent() {}
    public OutboxEvent(UUID aggregateId, String eventType, String payload) {
        this.id = UUID.randomUUID(); this.aggregateId = aggregateId; this.eventType = eventType; this.payload = payload;
        this.createdAt = Instant.now(); this.availableAt = this.createdAt;
    }
    public void markPublished() { status = OutboxStatus.PUBLISHED; publishedAt = Instant.now(); }
    public void markFailed(Exception exception) {
        retryCount++;
        status = OutboxStatus.FAILED;
        lastError = exception.getClass().getSimpleName() + ": " + safeMessage(exception);
        long delaySeconds = Math.min(300, 1L << Math.min(retryCount - 1, 8));
        availableAt = Instant.now().plusSeconds(delaySeconds);
    }
    public UUID getId() { return id; }
    public UUID getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public OutboxStatus getStatus() { return status; }
    public int getRetryCount() { return retryCount; }
    public Instant getAvailableAt() { return availableAt; }
    public String getLastError() { return lastError; }
    public Instant getCreatedAt() { return createdAt; }

    private static String safeMessage(Exception exception) {
        String message = exception.getMessage();
        return message == null ? "unknown" : message.substring(0, Math.min(450, message.length()));
    }
}
