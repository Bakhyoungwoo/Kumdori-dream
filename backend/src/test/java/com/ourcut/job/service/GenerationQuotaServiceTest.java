package com.ourcut.job.service;

import com.ourcut.job.domain.PipelineType;
import com.ourcut.job.dto.JobDtos;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GenerationQuotaServiceTest {
    @Mock private StringRedisTemplate redis;

    private GenerationQuotaService quota;

    @BeforeEach
    void setUp() {
        quota = new GenerationQuotaService(redis, 20, 100);
    }

    @Test
    void cvRequestsDoNotReserveQuota() {
        JobDtos.CreateJobRequest request = new JobDtos.CreateJobRequest(
            null, PipelineType.CV, null, null, 1, List.of(new JobDtos.Input(0, "users/user/inputs/a.jpg")));

        quota.reserve(UUID.randomUUID(), request);

        verifyNoInteractions(redis);
    }

    @Test
    void generativeRequestUsesAtomicRedisScript() {
        when(redis.execute(any(), anyList(), anyString(), anyString(), anyString(), anyString())).thenReturn(1L);
        JobDtos.CreateJobRequest request = new JobDtos.CreateJobRequest(
            null, PipelineType.GENERATIVE, null, "warm light", 2,
            List.of(new JobDtos.Input(0, "users/user/inputs/a.jpg")));

        quota.reserve(UUID.randomUUID(), request);

        verify(redis).execute(any(), anyList(), eq("2"), eq("20"), eq("100"), anyString());
    }

    @Test
    void rejectsWhenAtomicReservationReportsLimitExceeded() {
        when(redis.execute(any(), anyList(), anyString(), anyString(), anyString(), anyString())).thenReturn(0L);
        JobDtos.CreateJobRequest request = new JobDtos.CreateJobRequest(
            null, PipelineType.GENERATIVE, null, "warm light", 2,
            List.of(new JobDtos.Input(0, "users/user/inputs/a.jpg")));

        assertThatThrownBy(() -> quota.reserve(UUID.randomUUID(), request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("429 TOO_MANY_REQUESTS");
    }
}
