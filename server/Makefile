MIGRATIONS_PATH = ./internal/db/migrations 

create_db:
	@docker compose up --build -d

migration:
	@goose -s -dir $(MIGRATIONS_PATH) create $(MIGRATION_NAME) sql

migrate-up:
	@goose up

migrate-down:
	@goose down

.PHONY: migration migrate-up migrate-down create_db