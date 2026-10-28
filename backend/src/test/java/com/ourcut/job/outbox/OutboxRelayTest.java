package com.ourcut.job.outbox;

import org.apache.kafka.clients.producer.RecordMetadata;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import com.ourcut.job.repository.ComposeJobRepository;
import com.ourcut.job.domain.ComposeJob;
import com.ourcut.job.domain.MediaType;
import com.ourcut.job.domain.PipelineType;
import com.ourcut.user.domain.User;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

class OutboxRelayTest {
    @Test
    void publishFailureIsRecordedAsFailedEvent() {
        OutboxEventRepository events = mock(OutboxEventRepository.class);
        ComposeJobRepository jobs = mock(ComposeJobRepository.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "COMPOSE_REQUESTED", "{}");
        when(kafka.send(anyString(), anyString(), anyString()))
            .thenReturn(CompletableFuture.failedFuture(new RuntimeException("broker unavailable")));

        OutboxRelay relay = new OutboxRelay(events, jobs, kafka, new SimpleMeterRegistry(), "compose.request", 50);
        relay.publish(List.of(event));

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.FAILED);
        assertThat(event.getRetryCount()).isEqualTo(1);
        assertThat(event.getLastError()).contains("broker unavailable");
        verify(events).save(event);
    }

    @Test
    void publishSuccessMarksEventPublished() {
        OutboxEventRepository events = mock(OutboxEventRepository.class);
        ComposeJobRepository jobs = mock(ComposeJobRepository.class);
        @SuppressWarnings("unchecked") KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        ComposeJob job = new ComposeJob(new User("queue@example.com", "queue"), null,
            PipelineType.CV, MediaType.IMAGE, null, 1, "queue-key");
        OutboxEvent event = new OutboxEvent(job.getId(), "COMPOSE_REQUESTED", "{}");
        when(kafka.send(anyString(), anyString(), anyString()))
            .thenReturn(CompletableFuture.completedFuture(null));
        when(jobs.findById(job.getId())).thenReturn(java.util.Optional.of(job));

        OutboxRelay relay = new OutboxRelay(events, jobs, kafka, new SimpleMeterRegistry(), "compose.request", 50);
        relay.publish(List.of(event));

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        assertThat(job.getStatus()).isEqualTo(com.ourcut.job.domain.ComposeJobStatus.QUEUED);
        verify(events).save(event);
    }
}
