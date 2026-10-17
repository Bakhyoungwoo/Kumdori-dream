package com.ourcut.job.outbox;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.EmbeddedKafkaKraftBroker;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class OutboxRelayKafkaIntegrationTest {
    @Test
    void brokerFailsDuringTestAndRelayRecordsRetryMetadata() throws Exception {
        EmbeddedKafkaKraftBroker kafka = new EmbeddedKafkaKraftBroker(1, 1, "compose.request");
        kafka.afterPropertiesSet();

        KafkaTemplate<String, String> producer = new KafkaTemplate<>(
            new DefaultKafkaProducerFactory<>(producerProperties(kafka.getBrokersAsString())));
        KafkaTemplate<String, String> relayProducer = null;
        try {
            producer.send("compose.request", "baseline", "baseline-event").get(10, TimeUnit.SECONDS);

            OutboxEventRepository events = mock(OutboxEventRepository.class);
            OutboxEvent event = new OutboxEvent(UUID.randomUUID(), "COMPOSE_REQUESTED", "{}");
            relayProducer = new KafkaTemplate<>(
                new DefaultKafkaProducerFactory<>(producerProperties(kafka.getBrokersAsString())));
            OutboxRelay relay = new OutboxRelay(events, relayProducer, "compose.request", 50);

            // 장애는 테스트 외부에서 주입하지 않고, 통합 테스트 시나리오 중 브로커 종료로 발생시킨다.
            kafka.destroy();
            relay.publish(List.of(event));

            assertThat(event.getStatus()).isEqualTo(OutboxStatus.FAILED);
            assertThat(event.getRetryCount()).isEqualTo(1);
            assertThat(event.getAvailableAt()).isAfter(event.getCreatedAt());
            verify(events).save(event);
        } finally {
            producer.destroy();
            if (relayProducer != null) {
                relayProducer.destroy();
            }
            kafka.destroy();
        }
    }

    private static Map<String, Object> producerProperties(String bootstrapServers) {
        return Map.of(
            ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
            ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
            ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
            ProducerConfig.ACKS_CONFIG, "all",
            ProducerConfig.RETRIES_CONFIG, 0,
            ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 1000,
            ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 2000,
            ProducerConfig.MAX_BLOCK_MS_CONFIG, 2000);
    }
}
