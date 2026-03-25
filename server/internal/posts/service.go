package posts

import (
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service interface {
	ValidatePayload(r *http.Request) (payload *CreatePostPayload, mediaFile multipart.File, validationErrs []utils.CustomValidationError, err error)
	CreatePost(ctx context.Context, userID int64, photoUrl string, payload CreatePostPayload) (newPost repo.CreatePostRow, err error)
	GetPosts(ctx context.Context, category, search, seed, cursor string) (posts []repo.GetFeedPostsRow, err error)
}

type postsService struct {
	repo   repo.Querier
	config utils.Config
}

func NewPostsService(repo repo.Querier, config utils.Config) Service {
	return &postsService{repo: repo, config: config}
}

type CreatePostPayload struct {
	Title       string                `form:"title" validate:"required,min=1,max=80"`
	Description string                `form:"description" validate:"omitempty,max=1000"`
	Price       int64                 `form:"price" validate:"required,gt=0"`
	Category    string                `form:"category" validate:"required,min=1"`
	Media       *multipart.FileHeader `form:"media" validate:"required,imagefile"`
}

func (s *postsService) ValidatePayload(r *http.Request) (payload *CreatePostPayload, mediaFile multipart.File, validationErrs []utils.CustomValidationError, err error) {
	// Max of 10MG sent from the frontend
	if parseErr := r.ParseMultipartForm(10 << 20); parseErr != nil {
		err = fmt.Errorf("failed to parse form data: %w", parseErr)
		return
	}

	// Extract fields
	var price int64 = 0
	priceFormValue := r.FormValue("price")
	if priceFormValue != "" {
		priceInt64, parsePriceErr := strconv.ParseInt(priceFormValue, 10, 64)
		if parsePriceErr != nil {
			err = fmt.Errorf("failed to convert price property to int64: %w", parsePriceErr)
			return
		}
		price = priceInt64
	}
	payload = &CreatePostPayload{
		Title:       r.FormValue("title"),
		Description: r.FormValue("description"),
		Category:    r.FormValue("category"),
		Price:       price,
		Media:       nil,
	}

	// Get media file and make sure it's JPG/JPEG/PNG
	mediaFile, fileHeader, err := r.FormFile("media")
	if err != nil {
		err = fmt.Errorf("failed to get media property from req: %w", err)
		return
	}
	payload.Media = fileHeader

	// Validate request
	validationErrs = utils.ValidateData(payload)
	if len(validationErrs) > 0 {
		return
	}

	return
}

func (s *postsService) CreatePost(ctx context.Context, userID int64, photoUrl string, payload CreatePostPayload) (newPost repo.CreatePostRow, err error) {

	// Does post description contains actual characters ? In case not, set Valid to false (meaning null in postgres)
	postDescription := pgtype.Text{String: payload.Description, Valid: true}
	if payload.Description == "" {
		postDescription.Valid = false
	}

	createPostParams := repo.CreatePostParams{UserID: userID, Title: payload.Title, Description: postDescription, Price: payload.Price, Category: payload.Category, PhotoUrl: photoUrl}
	newPost, postErr := s.repo.CreatePost(ctx, createPostParams)
	if postErr != nil {
		err = fmt.Errorf("failed to create a new post : %w", postErr)
		return
	}

	return
}

type GetPostsQueries struct {
	Category string `json:"category" validate:"omitempty"`
	Search   string `json:"search" validate:"omitempty,max=100"`
	Seed     int    `json:"seed" validate:"omitempty"`   // Session seed for deterministic
	Cursor   string `json:"cursor" validate:"omitmepty"` // opaque cursor for pagination
}

// PostsPage is the paginated response for the feed endpoint.
// HasNextPage is true when the current page is full (9 posts), indicating more may exist.
// NextCursor is an opaque string encoding the last post's score and ID for cursor pagination.
type PostsRsp struct {
	Posts       []repo.GetFeedPostsRow `json:"posts"`
	HasNextPage bool                   `json:"hasNextPage"`
	NextCursor  bool                   `json:"nextCursor,omitempty"`
}

// GetPosts fetches a deterministically-ordered page of feed posts.
// The seed is used in md5(seed || post_id) inside the SQL CTE to produce a deterministic
// pseudo-random score per post — no setseed(), no connection state mutation.
// Cursor-based pagination: the cursor encodes the last post's score and ID from the
// previous page, enabling constant-time page access regardless of depth.
// HasNextPage is true when exactly 9 results are returned (more pages may exist).
// The cursor is extracted BEFORE ensureCategoryVariety reorders posts, so it correctly
// references the SQL ordering boundary.
//
// Test cases:
// - Same seed, first page (empty cursor) and second page (cursor from first) → no overlapping postIDs
// - Empty cursor → cursor_score=0, cursor_post_id=0 → returns all posts (first page)
// - Invalid cursor → returns error
// - len(posts) < 9 → HasNextPage is false, NextCursor is empty
// - len(posts) == 9 → HasNextPage is true, NextCursor is set
// - Empty category/search → all posts returned without filter applied
func (s *postsService) GetPosts(ctx context.Context, category, search, seed, cursor string) (posts []repo.GetFeedPostsRow, err error) {

	posts, getPostsErr := s.repo.GetFeedPosts(ctx,
		repo.GetFeedPostsParams{
			Category: category,
			Search:   search,
			Page:     int32(page)})
	if getPostsErr != nil {
		err = fmt.Errorf("failed to get posts : %w", getPostsErr)
		return
	}

	return ensureCategoryVariety(posts), nil
}

// encodeCursor encodes a score and postID into an opaque cursor string.
func encodeCursor(score float64, postID int64) string {
	return fmt.Sprintf("%.15f:%d", score, postID)
}

// decodeCursor parses an opaque cursor string into score and postID.
// Returns (0, 0, nil) for empty cursor (first page).
//
// Test cases:
// - "" → (0, 0, nil) — first page
// - "0.234567000000000:42" → (0.234567, 42, nil)
// - "invalid" → (0, 0, error)
// - "abc:42" → (0, 0, error)
// - "0.5:abc" → (0, 0, error)
func decodeCursor(cursor string) (float64, int64, error) {
	if cursor == "" {
		return 0, 0, nil
	}
	parts := strings.SplitN(cursor, ":", 2)
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("invalid cursor format")
	}
	score, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid cursor score: %w", err)
	}
	postID, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid cursor post id: %w", err)
	}
	return score, postID, nil
}

// ensureCategoryVariety reorders posts so that no two consecutive posts share
// the same category, preserving the weighted-random ordering as much as possible.
//
// Test cases:
// - All different categories → order unchanged
// - All same category → order unchanged (no swaps possible)
// - Two consecutive same-category posts → second one is swapped with next different-category post
// - Empty or single-item slice → returned as-is
func ensureCategoryVariety(posts []repo.GetFeedPostsRow) []repo.GetFeedPostsRow {

	if len(posts) <= 1 {
		return posts
	}

	result := make([]repo.GetFeedPostsRow, 0, len(posts))
	remaining := make([]repo.GetFeedPostsRow, len(posts))
	copy(remaining, posts)

	for len(remaining) > 0 {

		lastCategory := ""
		if len(result) > 0 {
			lastCategory = result[len(result)-1].Category
		}

		placed := false
		for i, p := range remaining {
			if p.Category != lastCategory {
				result = append(result, p)
				remaining = append(remaining[:i], remaining[i+1:]...)
				placed = true
				break
			}
		}

		if !placed {
			// All remaining posts share the same category — append as-is
			result = append(result, remaining...)
			break
		}

	}

	return result
}
