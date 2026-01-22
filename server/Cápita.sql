CREATE TABLE "users" (
  "user_id" bigserial PRIMARY KEY,
  "social_id" varchar UNIQUE,
  "email" varchar UNIQUE NOT NULL,
  "username" varchar NOT NULL,
  "picture" varchar NOT NULL,
  "is_user_valid" boolean NOT NULL DEFAULT (true),
  "registered_at" timestamptz NOT NULL DEFAULT (now())
);

CREATE TABLE "posts" (
  "post_id" bigserial PRIMARY KEY,
  "user_id" bigint,
  "title" varchar(100) NOT NULL,
  "description" varchar(400),
  "price" bigint NOT NULL,
  "category" text NOT NULL,
  "photo_url" text NOT NULL,
  "registered_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);

ALTER TABLE "posts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");
