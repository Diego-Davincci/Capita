-- +goose Up
-- +goose StatementBegin
CREATE TABLE "users" (
  "user_id" bigserial,
  "social_id" varchar,
  "email" varchar NOT NULL,
  "username" varchar NOT NULL,
  "picture" varchar NOT NULL,
  "is_user_valid" boolean NOT NULL DEFAULT (true),
  "registered_at" timestamptz NOT NULL DEFAULT (now()),
  PRIMARY KEY ("user_id", "social_id")
);
COMMENT ON TABLE "users" IS 'primary key is composed by user_id and social_id, both of those properties are unique';
COMMENT ON COLUMN users.social_id IS 'this field is for the unique id provided by google to identify a user';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
