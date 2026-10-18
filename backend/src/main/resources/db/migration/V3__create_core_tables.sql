CREATE TABLE characters (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    profile_image_key VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE frames (
    id UUID PRIMARY KEY,
    character_id UUID REFERENCES characters(id),
    owner_user_id UUID REFERENCES users(id),
    source_type VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    template_key VARCHAR(500) NOT NULL,
    slot_count INTEGER NOT NULL DEFAULT 4,
    usage_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_frames_source_type CHECK (source_type = 'CHARACTER'),
    CONSTRAINT ck_frames_owner CHECK (character_id IS NOT NULL AND owner_user_id IS NULL),
    CONSTRAINT ck_frames_slot_count CHECK (slot_count BETWEEN 1 AND 4)
);

CREATE TABLE frame_slots (
    id UUID PRIMARY KEY,
    frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    target_image_key VARCHAR(500) NOT NULL,
    analysis JSONB,
    CONSTRAINT uq_frame_slot UNIQUE (frame_id, slot_index),
    CONSTRAINT ck_frame_slot_index CHECK (slot_index >= 0)
);

CREATE TABLE compose_jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    frame_id UUID REFERENCES frames(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    pipeline_type VARCHAR(20) NOT NULL DEFAULT 'CV',
    requirement_text VARCHAR(200),
    image_count INTEGER NOT NULL DEFAULT 1,
    progress INTEGER NOT NULL DEFAULT 0,
    error_code VARCHAR(100),
    idempotency_key VARCHAR(100) NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CONSTRAINT uq_compose_job_idempotency UNIQUE (user_id, idempotency_key),
    CONSTRAINT ck_compose_job_status CHECK (status IN ('PENDING', 'QUEUED', 'PROCESSING', 'DONE', 'FAILED', 'CANCELED')),
    CONSTRAINT ck_compose_job_pipeline CHECK (pipeline_type IN ('CV', 'GENERATIVE')),
    CONSTRAINT ck_compose_job_progress CHECK (progress BETWEEN 0 AND 100),
    CONSTRAINT ck_compose_job_image_count CHECK (image_count BETWEEN 1 AND 4),
    CONSTRAINT ck_compose_job_requirement CHECK ((pipeline_type = 'GENERATIVE' AND requirement_text IS NOT NULL) OR (pipeline_type = 'CV' AND requirement_text IS NULL AND image_count = 1))
);

CREATE TABLE compose_job_inputs (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES compose_jobs(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    user_image_key VARCHAR(500) NOT NULL,
    CONSTRAINT uq_job_input_slot UNIQUE (job_id, slot_index),
    CONSTRAINT ck_job_input_slot_index CHECK (slot_index >= 0)
);

CREATE TABLE compose_results (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES compose_jobs(id) ON DELETE CASCADE,
    variant_index INTEGER NOT NULL DEFAULT 0,
    result_key VARCHAR(500) NOT NULL,
    thumbnail_key VARCHAR(500),
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_result_variant UNIQUE (job_id, variant_index),
    CONSTRAINT ck_result_variant_index CHECK (variant_index BETWEEN 0 AND 3)
);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,
    CONSTRAINT ck_outbox_status CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED'))
);

CREATE INDEX ix_frames_source_type ON frames(source_type);
CREATE INDEX ix_frames_character_id ON frames(character_id);
CREATE INDEX ix_frames_owner_user_id ON frames(owner_user_id);
CREATE INDEX ix_compose_jobs_user_created ON compose_jobs(user_id, created_at DESC);
CREATE INDEX ix_compose_jobs_status_updated ON compose_jobs(status, updated_at);
CREATE INDEX ix_outbox_events_pending ON outbox_events(status, created_at);
