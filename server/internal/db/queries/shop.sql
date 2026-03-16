-- name: CreateShop :exec
INSERT INTO shop (user_id, name, description, phone_number) 
VALUES ($1, $2, $3, $4) 
ON CONFLICT (user_id) DO 
UPDATE SET 
name = $2,
description = $3,
phone_number = $4,
updated_at = now(); 
