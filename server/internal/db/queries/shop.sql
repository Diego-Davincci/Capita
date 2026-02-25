-- name: CreateShop :exec
INSERT INTO shop (user_id, name, description, whatsapp_link) VALUES ($1, $2, $3, $4);
