package posts

import (
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"strconv"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/Diego-Davincci/Capita/internal/utils"
)

type Service interface {
	ValidatePayload(r *http.Request) (payload *CreatePostPayload, mediaFile multipart.File, validationErrs []utils.CustomValidationError, err error)
	CreatePost(ctx context.Context) (err error)
}

type postsService struct {
	repo   repo.Querier
	config utils.Config
}

func NewPostsService(repo repo.Querier, config utils.Config) Service {
	return &postsService{repo: repo, config: config}
}

type CreatePostPayload struct {
	Title       string                `form:"title" validate:"required,min=1,max=100"`
	Description string                `form:"description" validate:"omitempty,max=400"`
	Price       int64                 `form:"price" validate:"required,gt=0"`
	Category    string                `form:"category" validate:"required,min=1"`
	Media       *multipart.FileHeader `form:"media" validate:"required"`
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

	// Get media file
	file, fileHeader, err := r.FormFile("media")
	if err != nil {
		return &CreatePostPayload{}, nil, []utils.CustomValidationError{}, fmt.Errorf("failed to get media property from req: %w", err)
	}
	defer file.Close()
	payload.Media = fileHeader

	// Validate request
	validationErrs = utils.ValidateData(payload)
	if len(validationErrs) > 0 {
		return &CreatePostPayload{}, nil, validationErrs, nil
	}

	return
}

func (s *postsService) CreatePost(ctx context.Context) error {

	return nil

}
