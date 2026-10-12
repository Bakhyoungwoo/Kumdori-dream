CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(320) UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN'))
);

CREATE TABLE auth_identities (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(20) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    CONSTRAINT uq_auth_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT ck_auth_provider CHECK (provider IN ('LOCAL', 'GOOGLE')),
    CONSTRAINT ck_local_password CHECK (
        (provider = 'LOCAL' AND password_hash IS NOT NULL)
        OR (provider = 'GOOGLE' AND password_hash IS NULL)
    )
);

CREATE TABLE refresh_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    replaced_by UUID REFERENCES refresh_sessions(id),
    device_name VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_auth_identities_user_id ON auth_identities(user_id);
CREATE INDEX ix_refresh_sessions_user_id ON refresh_sessions(user_id);
