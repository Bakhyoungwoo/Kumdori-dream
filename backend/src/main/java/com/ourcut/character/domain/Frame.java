package com.ourcut.character.domain;

import com.ourcut.user.domain.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "frames")
public class Frame {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "character_id") private Character character;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_user_id") private User owner;
    @Enumerated(EnumType.STRING) @Column(name = "source_type", nullable = false, length = 20) private FrameSourceType sourceType;
    @Column(nullable = false, length = 150) private String title;
    @Column(length = 500) private String description;
    @Column(name = "template_key", nullable = false, length = 500) private String templateKey;
    @Column(name = "slot_count", nullable = false) private int slotCount = 4;
    @Column(name = "usage_count", nullable = false) private long usageCount;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @OneToMany(mappedBy = "frame", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("slotIndex ASC") private List<FrameSlot> slots = new ArrayList<>();

    protected Frame() {}
    private Frame(Character character, User owner, FrameSourceType sourceType, String title, String description, String templateKey, int slotCount) {
        this.id = UUID.randomUUID(); this.character = character; this.owner = owner; this.sourceType = sourceType;
        this.title = title; this.description = description; this.templateKey = templateKey; this.slotCount = slotCount;
        this.createdAt = Instant.now();
    }
    public static Frame characterFrame(Character character, String title, String description, String templateKey, int slotCount) {
        return new Frame(character, null, FrameSourceType.CHARACTER, title, description, templateKey, slotCount);
    }
    public static Frame userFrame(User owner, String title, String description, String templateKey, int slotCount) {
        return new Frame(null, owner, FrameSourceType.USER_UPLOADED, title, description, templateKey, slotCount);
    }
    public void addSlot(int index, String targetImageKey, String analysis) { slots.add(new FrameSlot(this, index, targetImageKey, analysis)); }
    public void recordUsage() { usageCount++; }
    public UUID getId() { return id; }
    public FrameSourceType getSourceType() { return sourceType; }
    public Character getCharacter() { return character; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getTemplateKey() { return templateKey; }
    public long getUsageCount() { return usageCount; }
    public int getSlotCount() { return slotCount; }
    public List<FrameSlot> getSlots() { return Collections.unmodifiableList(slots); }
}
