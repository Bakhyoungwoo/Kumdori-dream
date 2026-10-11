package com.ourcut.auth.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {
    private static final String SECRET = "local-test-secret-that-is-at-least-32-chars";

    @Test
    void createsAndParsesAccessToken() {
        JwtTokenProvider provider = new JwtTokenProvider(SECRET, 1_800_000L);
        UUID userId = UUID.randomUUID();

        String token = provider.createAccessToken(userId);

        assertThat(provider.parseUserId(token)).isEqualTo(userId);
    }

    @Test
    void rejectsSecretShorterThanThirtyTwoCharacters() {
        assertThatThrownBy(() -> new JwtTokenProvider("too-short", 1_800_000L))
            .isInstanceOf(IllegalStateException.class);
    }
}
