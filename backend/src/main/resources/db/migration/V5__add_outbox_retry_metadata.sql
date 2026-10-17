ALTER TABLE outbox_events
    ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN last_error VARCHAR(500);

CREATE INDEX ix_outbox_events_ready ON outbox_events(status, available_at, created_at);
