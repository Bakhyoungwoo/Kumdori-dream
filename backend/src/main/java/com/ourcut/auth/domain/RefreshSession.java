package com.ourcut.auth.domain;

import com.ourcut.user.domain.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "refresh_sessions")
public class RefreshSession {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "revoked_at") private Instant revokedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "replaced_by") private RefreshSession replacedBy;
    @Column(name = "device_name", length = 100) private String deviceName;
    @Column(name = "user_agent") private String userAgent;
    @JdbcTypeCode(SqlTypes.INET) @Column(name = "ip_address") private String ipAddress;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    protected RefreshSession() {}
    public RefreshSession(User user, String tokenHash, Instant expiresAt) {
        this(user, tokenHash, expiresAt, null, null, null);
    }
    public RefreshSession(User user, String tokenHash, Instant expiresAt, String deviceName, String userAgent, String ipAddress) {
        this.id = UUID.randomUUID(); this.user = user; this.tokenHash = tokenHash;
        this.expiresAt = expiresAt; this.deviceName = deviceName; this.userAgent = userAgent;
        this.ipAddress = ipAddress; this.createdAt = Instant.now();
    }
    public User getUser() { return user; }
    public RefreshSession getReplacedBy() { return replacedBy; }
    public String getDeviceName() { return deviceName; }
    public String getUserAgent() { return userAgent; }
    public String getIpAddress() { return ipAddress; }
    public boolean isUsable() { return revokedAt == null && expiresAt.isAfter(Instant.now()); }
    public void revoke() { revokedAt = Instant.now(); }
    public void revokeReplacedBy(RefreshSession successor) { this.replacedBy = successor; revoke(); }
}
