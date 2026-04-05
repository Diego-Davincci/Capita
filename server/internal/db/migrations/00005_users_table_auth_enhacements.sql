-- +goose Up
-- +goose StatementBegin
ALTER TABLE users ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN last_sign_in_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users DROP COLUMN is_user_valid;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN is_blocked;
ALTER TABLE users DROP COLUMN is_admin;
ALTER TABLE users DROP COLUMN last_sign_in_at;
ALTER TABLE users ADD COLUMN is_user_valid boolean NOT NULL DEFAULT true;
-- +goose StatementEnd
