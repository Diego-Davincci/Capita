-- name: CreateSession :one
INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at) 
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSessionByRefreshToken :one
SELECT * FROM sessions WHERE refresh_token = $1;

-- name: UpdateSessionToken :exec
UPDATE sessions SET refresh_token = $1, expires_at = $2, updated_at = now() WHERE session_id = $3;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE refresh_token = $1;

-- name: DeleteAllSessionsByUserID :exec
DELETE FROM sessions WHERE user_id = $1;