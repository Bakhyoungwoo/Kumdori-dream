package com.ourcut.job.domain;

import com.ourcut.character.domain.Frame;
import com.ourcut.user.domain.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "compose_jobs", uniqueConstraints = @UniqueConstraint(name = "uq_compose_job_idempotency", columnNames = {"user_id", "idempotency_key"}))
public class ComposeJob {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "frame_id") private Frame frame;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ComposeJobStatus status = ComposeJobStatus.PENDING;
    @Enumerated(EnumType.STRING) @Column(name = "pipeline_type", nullable = false, length = 20) private PipelineType pipelineType = PipelineType.CV;
    @Column(name = "requirement_text", length = 200) private String requirementText;
    @Column(name = "image_count", nullable = false) private int imageCount = 1;
    @Column(nullable = false) private int progress;
    @Column(name = "error_code", length = 100) private String errorCode;
    @Column(name = "idempotency_key", nullable = false, length = 100) private String idempotencyKey;
    @Column(name = "retry_count", nullable = false) private int retryCount;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;
    @Column private Instant startedAt;
    @Column private Instant finishedAt;
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("slotIndex ASC") private List<ComposeJobInput> inputs = new ArrayList<>();
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true) @OrderBy("variantIndex ASC") private List<ComposeResult> results = new ArrayList<>();

    protected ComposeJob() {}
    public ComposeJob(User user, Frame frame, PipelineType pipelineType, String requirementText, int imageCount, String idempotencyKey) {
        this.id = UUID.randomUUID(); this.user = user; this.frame = frame; this.pipelineType = pipelineType;
        this.requirementText = requirementText; this.imageCount = imageCount; this.idempotencyKey = idempotencyKey;
        this.createdAt = Instant.now(); this.updatedAt = this.createdAt;
    }
    public void addInput(int slotIndex, String userImageKey) { inputs.add(new ComposeJobInput(this, slotIndex, userImageKey)); }
    public void queue() { changeStatus(ComposeJobStatus.QUEUED); }
    public void start() { changeStatus(ComposeJobStatus.PROCESSING); startedAt = Instant.now(); }
    public void updateProgress(int value) { if (value < 0 || value > 100) throw new IllegalArgumentException("progress must be between 0 and 100"); progress = value; updatedAt = Instant.now(); }
    public void complete() { changeStatus(ComposeJobStatus.DONE); progress = 100; finishedAt = Instant.now(); }
    public void fail(String errorCode) { this.errorCode = errorCode; changeStatus(ComposeJobStatus.FAILED); finishedAt = Instant.now(); }
    public void cancel() {
        if (status == ComposeJobStatus.DONE || status == ComposeJobStatus.FAILED || status == ComposeJobStatus.CANCELED) {
            throw new IllegalStateException("Job cannot be canceled in status " + status);
        }
        changeStatus(ComposeJobStatus.CANCELED);
        finishedAt = Instant.now();
    }
    public void addResult(int variantIndex, String resultKey, String thumbnailKey, Integer width, Integer height) {
        results.add(new ComposeResult(this, variantIndex, resultKey, thumbnailKey, width, height));
    }
    private void changeStatus(ComposeJobStatus value) { status = value; updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Frame getFrame() { return frame; }
    public ComposeJobStatus getStatus() { return status; }
    public PipelineType getPipelineType() { return pipelineType; }
    public String getRequirementText() { return requirementText; }
    public int getImageCount() { return imageCount; }
    public int getProgress() { return progress; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getErrorCode() { return errorCode; }
    public List<ComposeJobInput> getInputs() { return Collections.unmodifiableList(inputs); }
    public List<ComposeResult> getResults() { return Collections.unmodifiableList(results); }
}
