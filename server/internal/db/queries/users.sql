-- name: CreateUser :exec
INSERT INTO users (social_id, email, username, picture) VALUES ($1, $2, $3, $4);