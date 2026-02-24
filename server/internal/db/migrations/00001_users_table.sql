-- +goose Up
-- +goose StatementBegin
CREATE TABLE "users" (
  "user_id" bigserial PRIMARY KEY,
  "social_id" varchar UNIQUE NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "username" varchar NOT NULL,
  "picture" varchar NOT NULL,
  "is_user_valid" boolean NOT NULL DEFAULT (true),
  "registered_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "users" IS 'social_id and email must be unique';
COMMENT ON COLUMN users.social_id IS 'this field is for the unique id provided by google to identify a user';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
