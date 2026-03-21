package posts

import (
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"strconv"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service interface {
	ValidatePayload(r *http.Request) (payload *CreatePostPayload, mediaFile multipart.File, validationErrs []utils.CustomValidationError, err error)
	CreatePost(ctx context.Context, userID int64, photoUrl string, payload CreatePostPayload) (newPost repo.CreatePostRow, err error)
	GetPosts(ctx context.Context, category, search string, page int) (posts []repo.GetFeedPostsRow, err error)
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
	Page     int    `json:"page" validate:"omitempty,min=0"`
}

// GetPosts fetches a feed of posts ordered by a recency-biased random score
// and ensures no two consecutive posts share the same category.
func (s *postsService) GetPosts(ctx context.Context, category, search string, page int) (posts []repo.GetFeedPostsRow, err error) {

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
