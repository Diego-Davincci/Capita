DRIVER=postgres
DBSTRING=postgres://admin:root@localhost:5434/monster-stack-go?sslmode=disable
MIGRATION_DIR=./internal/db/migrations

create_db:
	@docker compose up --build -d

migration:
	@goose -s -dir $(MIGRATION_DIR) create $(MIGRATION_NAME) sql

migrate_up:
	@goose -dir $(MIGRATION_DIR) $(DBSTRING) up 

migrate_down:
	@goose -dir $(MIGRATION_DIR) $(DBSTRING) down

sqlc:
	sqlc generate

.PHONY: migration migrate_up migrate_down create_db sqlc
