-- +goose Up
-- +goose StatementBegin
CREATE TABLE sessions(
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token varchar NOT NULL UNIQUE,
    user_agent text NOT NULL DEFAULT '',
    ip_address varchar NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL -- same as RT expiry
);
CREATE INDEX idx_session_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE sessions;
-- +goose StatementEnd
