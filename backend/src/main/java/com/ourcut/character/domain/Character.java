package com.ourcut.character.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "characters")
public class Character {
    @Id private UUID id;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "profile_image_key", length = 500) private String profileImageKey;
    @Column(nullable = false, updatable = false) private Instant createdAt;

    protected Character() {}
    public Character(String name, String profileImageKey) {
        this.id = UUID.randomUUID(); this.name = name; this.profileImageKey = profileImageKey;
        this.createdAt = Instant.now();
    }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getProfileImageKey() { return profileImageKey; }
}
