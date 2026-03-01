package users

import (
	"context"
	"fmt"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service interface {
	GetUser(ctx context.Context, userID int64) (user repo.GetUserByIDRow, err error)
	CreateShop(ctx context.Context, userID int64, payload CreateShopPayload) (err error)
}

type usersService struct {
	repo repo.Querier
}

func NewUsersService(repo repo.Querier) Service {
	return &usersService{repo: repo}
}

func (s *usersService) GetUser(ctx context.Context, userID int64) (user repo.GetUserByIDRow, err error) {

	user, getUserErr := s.repo.GetUserByID(ctx, userID)

	if getUserErr != nil {
		err = fmt.Errorf("error getting user %s", getUserErr)
		return repo.GetUserByIDRow{}, err
	}

	return
}

// Test cases:
// - Name required, 1–50 chars
// - Description optional, max 500 chars
// - WhatsappLink required, valid URL (https://wa.me/<number> satisfies this)
type CreateShopPayload struct {
	Name         string `json:"name" validate:"required,min=1,max=50"`
	Description  string `json:"description" validate:"omitempty"`
	WhatsappLink string `json:"whatsappLink" validate:"required,max=10,min=1"`
}

func (s *usersService) CreateShop(ctx context.Context, userID int64, payload CreateShopPayload) (err error) {

	// Does shop description contains actual characters ? In case not, set Valid to false (meaning null in postgres)
	textDescription := pgtype.Text{String: payload.Description, Valid: true}
	if payload.Description == "" {
		textDescription.Valid = false
	}

	shopParams := repo.CreateShopParams{UserID: userID, Name: payload.Name, Description: textDescription, WhatsappLink: payload.WhatsappLink}

	shopErr := s.repo.CreateShop(ctx, shopParams)
	if shopErr != nil {
		err = fmt.Errorf("error creating a new shop %s", shopErr)
		return
	}

	return
}
