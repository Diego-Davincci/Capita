package auth

import repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"

type Service interface {
	GetGoogleUserTokens(googleCode string) (tokens googleTokensModel, err error)
	GetGoogleUserData(userTokens googleTokensModel) (user googleUser, err error)
}

type authService struct {
	repo repo.Querier
}

func NewAuthService(repo repo.Querier) Service {
	return &authService{repo: repo}
}

type googleTokensModel struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int32  `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	IdToken      string `json:"id_token"`
}

func (s *authService) GetGoogleUserTokens(googleCode string) (tokens googleTokensModel, err error) {
	return googleTokensModel{}, nil
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

func (s *authService) GetGoogleUserData(userTokens googleTokensModel) (user googleUser, err error) {
	return googleUser{}, nil
}
