package com.ourcut.auth.domain;

import com.ourcut.user.domain.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_identities", uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "providerSubject"}))
public class AuthIdentity {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private AuthProvider provider;
    @Column(name = "provider_subject", nullable = false, length = 255) private String providerSubject;
    @Column(name = "password_hash", length = 255) private String passwordHash;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "last_login_at") private Instant lastLoginAt;

    protected AuthIdentity() {}
    private AuthIdentity(User user, AuthProvider provider, String subject, String passwordHash) {
        this.id = UUID.randomUUID(); this.user = user; this.provider = provider;
        this.providerSubject = subject; this.passwordHash = passwordHash; this.createdAt = Instant.now();
    }
    public static AuthIdentity local(User user, String email, String passwordHash) { return new AuthIdentity(user, AuthProvider.LOCAL, email, passwordHash); }
    public User getUser() { return user; }
    public String getPasswordHash() { return passwordHash; }
    public void markLogin() { lastLoginAt = Instant.now(); }
}
