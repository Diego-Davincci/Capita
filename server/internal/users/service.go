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
// - Name optional, 1–50 chars
// - Description optional, max 500 chars
// - WhatsappLink required, lenght of 10 chars
type CreateShopPayload struct {
	Name        string `json:"name" validate:"omitempty,min=1,max=50"`
	Description string `json:"description" validate:"omitempty"`
	PhoneNumber string `json:"phoneNumber" validate:"required,min=1,len=10"`
}

func (s *usersService) CreateShop(ctx context.Context, userID int64, payload CreateShopPayload) (err error) {

	// Does shop description/name contains actual characters ? In case not, set Valid to false (meaning null in postgres)
	textDescription := pgtype.Text{String: payload.Description, Valid: payload.Description != ""}
	textName := pgtype.Text{String: payload.Name, Valid: payload.Name != ""} // ← new

	shopParams := repo.CreateShopParams{UserID: userID, Name: textName, Description: textDescription, PhoneNumber: payload.PhoneNumber}

	shopErr := s.repo.CreateShop(ctx, shopParams)
	if shopErr != nil {
		err = fmt.Errorf("error creating a new shop %s", shopErr)
		return
	}

	return
}
