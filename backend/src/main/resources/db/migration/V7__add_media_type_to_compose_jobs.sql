ALTER TABLE compose_jobs ADD COLUMN media_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE';
ALTER TABLE compose_jobs ADD CONSTRAINT ck_compose_job_media_type CHECK (media_type IN ('IMAGE', 'VIDEO'));
