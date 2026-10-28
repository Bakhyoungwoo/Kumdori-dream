ALTER TABLE frames DROP CONSTRAINT ck_frames_source_type;
ALTER TABLE frames ADD CONSTRAINT ck_frames_source_type CHECK (source_type IN ('CHARACTER', 'USER_UPLOADED'));
ALTER TABLE frames DROP CONSTRAINT ck_frames_owner;
ALTER TABLE frames ADD CONSTRAINT ck_frames_owner CHECK (
    (source_type = 'CHARACTER' AND character_id IS NOT NULL AND owner_user_id IS NULL)
    OR (source_type = 'USER_UPLOADED' AND character_id IS NULL AND owner_user_id IS NOT NULL)
);
