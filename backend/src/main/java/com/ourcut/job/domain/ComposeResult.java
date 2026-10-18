package com.ourcut.job.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "compose_results", uniqueConstraints = @UniqueConstraint(name = "uq_result_variant", columnNames = {"job_id", "variant_index"}))
public class ComposeResult {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "job_id") private ComposeJob job;
    @Column(name = "variant_index", nullable = false) private int variantIndex;
    @Column(name = "result_key", nullable = false, length = 500) private String resultKey;
    @Column(name = "thumbnail_key", length = 500) private String thumbnailKey;
    private Integer width;
    private Integer height;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    protected ComposeResult() {}
    public ComposeResult(ComposeJob job, int variantIndex, String resultKey, String thumbnailKey, Integer width, Integer height) {
        this.id = UUID.randomUUID(); this.job = job; this.variantIndex = variantIndex; this.resultKey = resultKey;
        this.thumbnailKey = thumbnailKey; this.width = width; this.height = height; this.createdAt = Instant.now();
    }
    public String getResultKey() { return resultKey; }
    public String getThumbnailKey() { return thumbnailKey; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
}
