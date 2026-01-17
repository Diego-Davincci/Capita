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
	ValidatePayload(r *http.Request) (*CreatePostPayload, multipart.File, []utils.CustomValidationError, error)
	CreatePost(ctx context.Context) error
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
	Description string                `form:"description" validate:"omitempty,max=500"`
	Price       int64                 `form:"price" validate:"omitempty,gt=0"`
	Media       *multipart.FileHeader `form:"media" validate:"omitempty"`
}

func (s *postsService) ValidatePayload(r *http.Request) (*CreatePostPayload, multipart.File, []utils.CustomValidationError, error) {
	// Max of 10MG sent from the frontend
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return &CreatePostPayload{}, nil, []utils.CustomValidationError{}, fmt.Errorf("failed to parse form data: %w", err)
	}

	// Extract fields
	var price int64 = 0
	priceFormValue := r.FormValue("price")
	if priceFormValue != "" {
		priceInt64, err := strconv.ParseInt(priceFormValue, 10, 64)
		if err != nil {
			return &CreatePostPayload{}, nil, []utils.CustomValidationError{}, fmt.Errorf("failed to convert price property to int64: %w", err)
		}
		price = priceInt64
	}
	reqPayload := &CreatePostPayload{
		Title:       r.FormValue("title"),
		Description: r.FormValue("descriptions"),
		Price:       price,
		Media:       nil,
	}

	// Get media file
	file, fileHeader, err := r.FormFile("media")
	if err != nil {
		return &CreatePostPayload{}, nil, []utils.CustomValidationError{}, fmt.Errorf("failed to get media property from req: %w", err)
	}
	defer file.Close()
	reqPayload.Media = fileHeader

	// Validate request
	validationErrs := utils.ValidateData(reqPayload)
	if len(validationErrs) != 0 {
		return &CreatePostPayload{}, nil, []utils.CustomValidationError{}, fmt.Errorf("validation errors when creating a post: %w", err)
	}

	return reqPayload, file, []utils.CustomValidationError{}, nil
}

func (s *postsService) CreatePost(ctx context.Context) error {

	return nil

}
