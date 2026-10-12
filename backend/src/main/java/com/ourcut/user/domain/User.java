package com.ourcut.user.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    private UUID id;
    @Column(unique = true, length = 320)
    private String email;
    @Column(nullable = false, length = 50)
    private String nickname;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected User() {}
    public User(String email, String nickname) {
        this.id = UUID.randomUUID(); this.email = email; this.nickname = nickname;
        this.createdAt = Instant.now(); this.updatedAt = this.createdAt;
    }
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getNickname() { return nickname; }
    public UserStatus getStatus() { return status; }
    public Role getRole() { return role; }
    public void changeRole(Role role) { this.role = role; }

    @PreUpdate
    private void updateTimestamp() {
        updatedAt = Instant.now();
    }
}
