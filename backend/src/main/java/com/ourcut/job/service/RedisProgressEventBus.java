package com.ourcut.job.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class RedisProgressEventBus implements MessageListener, ProgressEventSink {
    static final String CHANNEL_PATTERN = "job-progress:*";
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final RedisMessageListenerContainer container;
    private final ComposeJobService jobs;
    private final SseEmitterRegistry registry;

    public RedisProgressEventBus(StringRedisTemplate redis, ObjectMapper objectMapper,
                                 RedisMessageListenerContainer container, ComposeJobService jobs,
                                 SseEmitterRegistry registry) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.container = container;
        this.jobs = jobs;
        this.registry = registry;
    }

    @PostConstruct
    void subscribe() {
        container.addMessageListener(this, new PatternTopic(CHANNEL_PATTERN));
    }

    public void publish(ProgressEvent event) {
        try {
            redis.convertAndSend(channel(event), objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize progress event", exception);
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            ProgressEvent event = objectMapper.readValue(message.getBody(), ProgressEvent.class);
            registry.broadcast(event, jobs.get(event.userId(), event.jobId()));
        } catch (Exception ignored) {
            // A malformed or stale event must not stop delivery of later progress events.
        }
    }

    static String channel(ProgressEvent event) {
        return "job-progress:" + event.jobId();
    }
}
