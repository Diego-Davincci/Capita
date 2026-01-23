-- name: CreatePost :exec
INSERT INTO posts (user_id, title, description, price, category, photo_url) VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetPosts :many
SELECT u.username as "username", u.picture "userPicture", p.post_id as "postID", p.user_id as "userID", p.title, p.description, p.price, p.category, 
p.photo_url as "postPhotoURL", p.registered_at as "registeredAt" FROM posts p 
LEFT JOIN users u on u.user_id = p.user_id;;
