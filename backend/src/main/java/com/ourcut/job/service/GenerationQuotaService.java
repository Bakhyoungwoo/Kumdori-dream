package com.ourcut.job.service;

import com.ourcut.job.domain.PipelineType;
import com.ourcut.job.dto.JobDtos;
import com.ourcut.job.dto.QuotaDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class GenerationQuotaService {
    private static final long COUNTER_TTL_SECONDS = Duration.ofDays(2).toSeconds();
    private static final DefaultRedisScript<Long> RESERVE_SCRIPT = new DefaultRedisScript<>("""
        local amount = tonumber(ARGV[1])
        local dailyLimit = tonumber(ARGV[2])
        local globalLimit = tonumber(ARGV[3])
        local ttl = tonumber(ARGV[4])
        local daily = tonumber(redis.call('GET', KEYS[1]) or '0')
        local global = tonumber(redis.call('GET', KEYS[2]) or '0')
        if daily + amount > dailyLimit or global + amount > globalLimit then
            return 0
        end
        local newDaily = redis.call('INCRBY', KEYS[1], amount)
        local newGlobal = redis.call('INCRBY', KEYS[2], amount)
        if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], ttl) end
        if redis.call('TTL', KEYS[2]) < 0 then redis.call('EXPIRE', KEYS[2], ttl) end
        return 1
        """, Long.class);

    private final StringRedisTemplate redis;
    private final int dailyImageLimit;
    private final int globalImageLimit;

    public GenerationQuotaService(StringRedisTemplate redis,
                                  @Value("${app.quota.daily-image-limit}") int dailyImageLimit,
                                  @Value("${app.quota.global-image-limit}") int globalImageLimit) {
        this.redis = redis;
        this.dailyImageLimit = dailyImageLimit;
        this.globalImageLimit = globalImageLimit;
    }

    public void reserve(UUID userId, JobDtos.CreateJobRequest request) {
        if (request.pipelineType() != PipelineType.GENERATIVE) return;
        int amount = request.resolvedImageCount();
        String dailyKey = "quota:" + userId + ":" + LocalDate.now();
        String globalKey = "quota:global:images:" + LocalDate.now();
        try {
            Long reserved = redis.execute(RESERVE_SCRIPT, List.of(dailyKey, globalKey),
                String.valueOf(amount), String.valueOf(dailyImageLimit), String.valueOf(globalImageLimit),
                String.valueOf(COUNTER_TTL_SECONDS));
            if (!Long.valueOf(1L).equals(reserved)) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Generation quota exceeded");
            }
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Quota service unavailable", exception);
        }
    }

    public QuotaDtos.Response get(UUID userId) {
        String date = LocalDate.now().toString();
        String dailyKey = "quota:" + userId + ":" + date;
        String globalKey = "quota:global:images:" + date;
        try {
            long used = valueOrZero(redis.opsForValue().get(dailyKey));
            long globalUsed = valueOrZero(redis.opsForValue().get(globalKey));
            return new QuotaDtos.Response(
                dailyImageLimit,
                used,
                Math.max(0, dailyImageLimit - used),
                globalImageLimit,
                globalUsed,
                Math.max(0, globalImageLimit - globalUsed),
                date
            );
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Quota service unavailable", exception);
        }
    }

    private long valueOrZero(String value) {
        return value == null ? 0L : Long.parseLong(value);
    }

}
