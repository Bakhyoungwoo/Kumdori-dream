ALTER TABLE compose_jobs DROP CONSTRAINT ck_compose_job_status;
ALTER TABLE compose_jobs ADD CONSTRAINT ck_compose_job_status CHECK (
    status IN ('PENDING', 'QUEUED', 'PROCESSING', 'DONE', 'FAILED', 'ENGINE_TIMEOUT', 'CANCELED')
);
