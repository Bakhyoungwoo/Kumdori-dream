package com.ourcut.job.outbox;

import org.apache.kafka.clients.producer.RecordMetadata;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OutboxRelayTest {
    @Test
    void publishFailureIsRecordedAsFailedEvent() {
        OutboxEventRepository events = mock(OutboxEventRepository.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "COMPOSE_REQUESTED", "{}");
        when(kafka.send(anyString(), anyString(), anyString()))
            .thenReturn(CompletableFuture.failedFuture(new RuntimeException("broker unavailable")));

        OutboxRelay relay = new OutboxRelay(events, kafka, "compose.request", 50);
        relay.publish(List.of(event));

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.FAILED);
        assertThat(event.getRetryCount()).isEqualTo(1);
        assertThat(event.getLastError()).contains("broker unavailable");
        verify(events).save(event);
    }

    @Test
    void publishSuccessMarksEventPublished() {
        OutboxEventRepository events = mock(OutboxEventRepository.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "COMPOSE_REQUESTED", "{}");
        when(kafka.send(anyString(), anyString(), anyString()))
            .thenReturn(CompletableFuture.completedFuture(null));

        OutboxRelay relay = new OutboxRelay(events, kafka, "compose.request", 50);
        relay.publish(List.of(event));

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        verify(events).save(event);
    }
}
