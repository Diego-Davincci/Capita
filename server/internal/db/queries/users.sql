-- name: GetUserBySocialID :one
SELECT * FROM users WHERE social_id = $1;

-- name: GetUserByID :one
SELECT users.user_id as "userID", users.email, users.username, users.picture, users.is_user_valid as "isUserValid", shop."name" as "shopName", shop.description as "shopDescription", shop.whatsapp_link as "shopWhatsappLink"
FROM users 
left join shop on users.user_id = shop.user_id
WHERE users.user_id = $1;

-- name: CreateUser :one
INSERT INTO users (social_id, email, username, picture) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: UpdateUser :one
UPDATE users SET email =  $1, username = $2, picture = $3 WHERE user_id = $4 RETURNING *;
