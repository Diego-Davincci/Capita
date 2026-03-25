-- name: CreatePost :one
INSERT INTO posts (user_id, title, description, price, category, photo_url) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING user_id, post_id, title, description, price, category, photo_url, registered_at;

-- name: GetPosts :many
SELECT u.username as "username", u.picture "userPicture", p.post_id as "postID", p.user_id as "userID", p.title, p.description, p.price, p.category, 
p.photo_url as "postPhotoURL", p.registered_at as "registeredAt" FROM posts p 
LEFT JOIN users u on u.user_id = p.user_id;

-- name: GetFeedPosts :many
-- Returns posts ordered by a deterministic recency-biased score.
-- Uses md5(seed || post_id) for deterministic pseudo-random ordering — pure function,
-- no connection state mutation (unlike setseed).
-- Accepts a text seed generated client-side per browsing session.
-- score = md5_hash_as_float × 0.5^(age_in_weeks), half-life = 7 days.
-- Cursor-based pagination: pass cursor_score=0 and cursor_post_id=0 for the first page.
-- For subsequent pages, pass the score and postID of the last post from the previous page.
-- Pass an empty string for category/search to skip those filters.
WITH scored_posts AS (
  SELECT
    u.username        AS "username",
    u.picture         AS "userPicture",
    p.post_id         AS "postID",
    p.user_id         AS "userID",
    p.title,
    p.description,
    p.price,
    p.category,
    p.photo_url       AS "postPhotoURL",
    p.registered_at   AS "registeredAt",
    s.phone_number    AS "phoneNumber",
    s.name            AS "shopName",
    s.description     AS "shopDescription",
    (('x' || substr(md5(sqlc.arg(seed)::text || p.post_id::text), 1, 8))::bit(32)::bigint & 2147483647)::float8 / 2147483647.0
      * POW(0.5, EXTRACT(EPOCH FROM NOW() - p.registered_at) / 604800.0) AS score
  FROM posts p
  LEFT JOIN users u ON u.user_id = p.user_id
  LEFT JOIN shop s ON s.user_id = p.user_id
  WHERE (sqlc.arg(category)::text = '' OR p.category ILIKE sqlc.arg(category)::text)
  AND (
    sqlc.arg(search)::text = ''
    OR p.title       ILIKE '%' || sqlc.arg(search)::text || '%'
    OR p.description ILIKE '%' || sqlc.arg(search)::text || '%'
    OR u.username    ILIKE '%' || sqlc.arg(search)::text || '%'
    OR s.name        ILIKE '%' || sqlc.arg(search)::text || '%'
  )
)
SELECT "username", "userPicture", "postID", "userID", title, description, price, category,
       "postPhotoURL", "registeredAt", "phoneNumber", "shopName", "shopDescription", score
FROM scored_posts
WHERE (sqlc.arg(cursor_score)::float8 = 0 AND sqlc.arg(cursor_post_id)::bigint = 0)
   OR score < sqlc.arg(cursor_score)::float8
   OR (score = sqlc.arg(cursor_score)::float8 AND "postID" > sqlc.arg(cursor_post_id)::bigint)
ORDER BY score DESC, "postID" ASC
LIMIT 9;
