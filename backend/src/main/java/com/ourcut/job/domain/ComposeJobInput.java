package com.ourcut.job.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "compose_job_inputs", uniqueConstraints = @UniqueConstraint(name = "uq_job_input_slot", columnNames = {"job_id", "slot_index"}))
public class ComposeJobInput {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "job_id") private ComposeJob job;
    @Column(name = "slot_index", nullable = false) private int slotIndex;
    @Column(name = "user_image_key", nullable = false, length = 500) private String userImageKey;
    protected ComposeJobInput() {}
    ComposeJobInput(ComposeJob job, int slotIndex, String userImageKey) { this.id = UUID.randomUUID(); this.job = job; this.slotIndex = slotIndex; this.userImageKey = userImageKey; }
}
