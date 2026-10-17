package com.ourcut.job.outbox;

import org.apache.kafka.clients.producer.RecordMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class OutboxRelay {
    private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);

    private final OutboxEventRepository events;
    private final KafkaTemplate<String, String> kafka;
    private final String topic;
    private final int batchSize;

    public OutboxRelay(OutboxEventRepository events,
                       KafkaTemplate<String, String> kafka,
                       @Value("${app.outbox.topic}") String topic,
                       @Value("${app.outbox.batch-size}") int batchSize) {
        this.events = events;
        this.kafka = kafka;
        this.topic = topic;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-ms}")
    public void relayPendingEvents() {
        publish(events.findReadyByStatus(OutboxStatus.PENDING, PageRequest.of(0, batchSize)));
        publish(events.findReadyByStatus(OutboxStatus.FAILED, PageRequest.of(0, batchSize)));
    }

    @Transactional
    public void publish(List<OutboxEvent> pending) {
        for (OutboxEvent event : pending) {
            try {
                var result = kafka.send(topic, event.getAggregateId().toString(), event.getPayload())
                    .get(5, TimeUnit.SECONDS);
                event.markPublished();
                events.save(event);
                var metadata = result == null ? null : result.getRecordMetadata();
                log.info("outbox event published: eventId={}, aggregateId={}, topic={}, partition={}, offset={}",
                    event.getId(), event.getAggregateId(), topic,
                    metadataPartition(metadata), metadata == null ? -1L : metadata.offset());
            } catch (Exception exception) {
                event.markFailed(exception);
                events.save(event);
                log.warn("outbox event publish failed: eventId={}, aggregateId={}, topic={}, retryCount={}, nextAttemptAt={}",
                    event.getId(), event.getAggregateId(), topic, event.getRetryCount(), event.getAvailableAt(), exception);
            }
        }
    }

    private static int metadataPartition(RecordMetadata metadata) {
        return metadata == null ? -1 : metadata.partition();
    }
}
