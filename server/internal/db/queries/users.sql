-- name: GetUserBySocialID :one
SELECT * FROM users WHERE social_id = $1;

-- name: GetUserByID :one
SELECT user_id as "userID", email, username, picture, is_user_valid as "isUserValid" FROM users WHERE user_id = $1;

-- name: CreateUser :one
INSERT INTO users (social_id, email, username, picture) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: UpdateUser :one
UPDATE users SET email =  $1, username = $2, picture = $3 WHERE user_id = $4 RETURNING *;
