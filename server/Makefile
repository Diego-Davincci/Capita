create_db:
	docker compose up --build -d

migration:
	goose -s create $(MIGRATION_NAME) sql

sqlc:
	sqlc generate

.PHONY: migration create_db sqlc
