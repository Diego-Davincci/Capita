-- name: CreatePost :exec
INSERT INTO posts (user_id, title, description, price, category, photo_url) VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetPosts :many
SELECT u.username as "username", u.picture "userPicture", p.post_id as "postID", p.user_id as "userID", p.title, p.description, p.price, p.category, 
p.photo_url as "postPhotoURL", p.registered_at as "registeredAt" FROM posts p 
LEFT JOIN users u on u.user_id = p.user_id;

-- name: GetFeedPosts :many
-- Returns posts ordered by a recency-biased random score.
-- Newer posts have a higher expected score but older ones can still surface.
-- score = RANDOM() × 0.5^(age_in_weeks), half-life = 7 days.
-- Pass an empty string for category to return all categories.
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
  s.whatsapp_link	  AS "whatsappLink",
  s.name            AS "shopName",
  s.description     AS "shopDescription"
FROM posts p
LEFT JOIN users u ON u.user_id = p.user_id
LEFT JOIN shop s on s.user_id = p.user_id 
WHERE (sqlc.arg(category)::text = '' OR p.category = sqlc.arg(category)::text)
ORDER BY RANDOM() * POW(0.5, EXTRACT(EPOCH FROM NOW() - p.registered_at) / 604800.0) DESC
LIMIT sqlc.arg(max);
