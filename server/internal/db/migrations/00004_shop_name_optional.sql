-- +goose Up
-- +goose StatementBegin
ALTER TABLE shop ALTER COLUMN name DROP NOT NULL;
ALTER TABLE shop RENAME COLUMN whatsapp_link TO phone_number;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
UPDATE shop SET name = 'tienda' WHERE name IS NULL;
ALTER TABLE shop ALTER COLUMN name SET NOT NULL;
-- +goose StatementEnd
