package com.ourcut.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {
    private final SecretKey key;
    private final long accessExpiration;
    public JwtTokenProvider(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.access-token-expiration}") long accessExpiration) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET은 32자 이상의 값이어야 합니다.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpiration = accessExpiration;
    }
    public String createAccessToken(UUID userId) {
        Date now = new Date();
        return Jwts.builder().subject(userId.toString()).issuedAt(now).expiration(new Date(now.getTime() + accessExpiration)).signWith(key).compact();
    }
    public UUID parseUserId(String token) {
        return UUID.fromString(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject());
    }
    public long getAccessExpiration() { return accessExpiration; }
}
