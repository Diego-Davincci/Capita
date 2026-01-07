package auth

import (
	"context"
	"encoding/json"
	"fmt"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/Diego-Davincci/Capita/internal/utils"
	"golang.org/x/oauth2"
)

type Service interface {
	GetGoogleUserData(googleCode string, ctx context.Context) (userData googleUser, err error)
	RedirectToGoogleUrl() string
}

type authService struct {
	repo         repo.Querier
	config       utils.Config
	oauth2Config *oauth2.Config
}

func NewAuthService(repo repo.Querier, config utils.Config, oauth2Config *oauth2.Config) Service {
	return &authService{repo: repo, config: config, oauth2Config: oauth2Config}
}

func (s *authService) RedirectToGoogleUrl() string {
	url := s.oauth2Config.AuthCodeURL("secret", oauth2.AccessTypeOffline)
	return url
}

type googleUser struct {
	Id            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

func (s *authService) GetGoogleUserData(googleCode string, ctx context.Context) (userData googleUser, err error) {

	// Get access and refresh tokens in exchange for the code
	t, exchangeErr := s.oauth2Config.Exchange(ctx, googleCode)
	if exchangeErr != nil {
		err = fmt.Errorf("there was an error making the request to get google user tokens ---> %s", exchangeErr)
		return
	}

	// Make HTTP request to get user data using access token
	client := s.oauth2Config.Client(ctx, t)
	rsp, reqErr := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if reqErr != nil {
		err = fmt.Errorf("there was an error making the request to get google user data ---> %s", reqErr)
		return
	}
	defer rsp.Body.Close() // Close body data after function finishes

	// Transform rsp.body to JSON
	var v googleUser
	decodeErr := json.NewDecoder(rsp.Body).Decode(&v)
	if decodeErr != nil {
		err = fmt.Errorf("there was an error decoding user data ---> %s", decodeErr)
		return
	}
	fmt.Printf("%#v\n", v)

	return v, nil
}
