-- +goose Up
-- +goose StatementBegin
CREATE TABLE shop (
    "user_id" bigint PRIMARY KEY,
    "name" varchar(50) UNIQUE NOT NULL,
    "description" text,
    "whatsapp_link" text NOT NULL,
    "registered_at" timestamptz NOT NULL DEFAULT (now()),
    "updated_at" timestamptz NOT NULL DEFAULT (now())
);
ALTER TABLE "shop" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");  
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS shop;
-- +goose StatementEnd
