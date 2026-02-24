-- +goose Up
-- +goose StatementBegin
CREATE TABLE "posts" (
  "post_id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "title" varchar(80) NOT NULL,
  "description" varchar(1000),
  "price" bigint NOT NULL,
  "category" text NOT NULL,
  "photo_url" text NOT NULL,
  "registered_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

ALTER TABLE "posts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS posts;
-- +goose StatementEnd
