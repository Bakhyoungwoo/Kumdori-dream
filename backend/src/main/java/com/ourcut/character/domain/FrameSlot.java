package com.ourcut.character.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "frame_slots", uniqueConstraints = @UniqueConstraint(name = "uq_frame_slot", columnNames = {"frame_id", "slot_index"}))
public class FrameSlot {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "frame_id") private Frame frame;
    @Column(name = "slot_index", nullable = false) private int slotIndex;
    @Column(name = "target_image_key", nullable = false, length = 500) private String targetImageKey;
    @Column(columnDefinition = "jsonb") private String analysis;
    protected FrameSlot() {}
    FrameSlot(Frame frame, int slotIndex, String targetImageKey, String analysis) {
        this.id = UUID.randomUUID(); this.frame = frame; this.slotIndex = slotIndex;
        this.targetImageKey = targetImageKey; this.analysis = analysis;
    }
    public int getSlotIndex() { return slotIndex; }
    public String getTargetImageKey() { return targetImageKey; }
    public String getAnalysis() { return analysis; }
}
