package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/oauth2"
)

type Service interface {
	RedirectToGoogleUrl() string
	GetGoogleUserData(ctx context.Context, googleCode string) (userData googleUser, err error)
	CheckUserEmail(email string) (err error)
	UpsertUser(ctx context.Context, userData googleUser) (user repo.User, err error)
	// SetAuthCookies creates tokens, inserts a new session, and sets cookies.
	SetAuthCookies(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64) (err error)
	// RotateSession updates an existing session with a new RT jti and sets new cookies.
	RotateSession(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64, sessionID pgtype.UUID) (err error)
	// CheckUserBlocked returns an error if the user is blocked.
	CheckUserBlocked(ctx context.Context, userID int64) (err error)
	// LogoutUser deletes the session and clears cookies.
	LogoutUser(ctx context.Context, w http.ResponseWriter, refreshJTI string) (err error)
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

func (s *authService) GetGoogleUserData(ctx context.Context, googleCode string) (userData googleUser, err error) {

	// Get access and refresh tokens in exchange for the code
	t, exchangeErr := s.oauth2Config.Exchange(ctx, googleCode)
	if exchangeErr != nil {
		err = fmt.Errorf("error making the request to get google user tokens ---> %s", exchangeErr)
		return
	}

	// Make HTTP request to get user data using access token
	client := s.oauth2Config.Client(ctx, t)
	rsp, reqErr := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if reqErr != nil {
		err = fmt.Errorf("error making the request to get google user data ---> %s", reqErr)
		return
	}
	defer rsp.Body.Close() // Close body data after function finishes

	// Transform rsp.body to JSON
	var v googleUser
	decodeErr := json.NewDecoder(rsp.Body).Decode(&v)
	if decodeErr != nil {
		err = fmt.Errorf("error decoding user data ---> %s", decodeErr)
		return
	}
	// fmt.Printf("%#v\n", v)

	return v, nil
}

func (s *authService) CheckUserEmail(email string) (err error) {

	schoolDomain := "@unal.edu.co"
	validEmail := strings.Contains(email, schoolDomain)
	if !validEmail {
		err = errors.New("user has an email outisde the school")
		return
	}

	return nil
}

func (s *authService) UpsertUser(ctx context.Context, userData googleUser) (user repo.User, err error) {
	// Does the user exist ?
	googleUserID := userData.Id
	log.Println(googleUserID)
	user, getUserErr := s.repo.GetUserBySocialID(ctx, googleUserID)

	// If no user returned, create a new one
	if getUserErr == pgx.ErrNoRows {
		createUserParams := repo.CreateUserParams{SocialID: googleUserID, Email: userData.Email, Username: userData.Name, Picture: userData.Picture}
		userCreated, createUserErr := s.repo.CreateUser(ctx, createUserParams)
		if createUserErr != nil {
			err = fmt.Errorf("error creating a new user %s", createUserErr)
			return
		}
		return userCreated, nil
	}

	// If there's an error when getting the user, and it's not related to 0 returned rows, return the err
	if getUserErr != nil {
		err = fmt.Errorf("error fetching user by 'social_id' %s", getUserErr)
		return
	}

	// If user exists, update info (user google info might not change that often, but it's better to run the update)
	updateUserParams := repo.UpdateUserParams{Email: userData.Email, Username: userData.Name, Picture: userData.Picture, UserID: user.UserID}
	updatedUser, updateUserErr := s.repo.UpdateUser(ctx, updateUserParams)
	if updateUserErr != nil {
		err = fmt.Errorf("error updating user %s", getUserErr)
		return
	}

	return updatedUser, nil
}

func (s *authService) setCookies(w http.ResponseWriter, refreshToken, accessToken string) {

	// TODO: if we get a domain, set SameSite to 'lax'
	var sameSite http.SameSite
	var domain string
	if s.config.Domain != "localhost" {
		sameSite = http.SameSiteNoneMode
		domain = ""
	} else {
		sameSite = http.SameSiteLaxMode
		domain = s.config.Domain
	}

	maxTime := 315360000000 // 10 year
	http.SetCookie(w, &http.Cookie{Name: "rt", Value: refreshToken, Path: "/", Domain: domain, Secure: s.config.SecureCookies, HttpOnly: true, SameSite: sameSite, MaxAge: maxTime})
	http.SetCookie(w, &http.Cookie{Name: "at", Value: accessToken, Path: "/", Domain: domain, Secure: s.config.SecureCookies, HttpOnly: true, SameSite: sameSite, MaxAge: maxTime})

}

// SetAuthCookies creates tokens, stores a session record, and sets cookies.
// Returns the new access token JTI — used as the consistent session identifier in context.
func (s *authService) SetAuthCookies(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64) (err error) {

	refreshToken, accessToken, refreshJTI, _, err := utils.CreateTokens(userID, s.config.RefreshTokenKey, s.config.AccessTokenKey, s.config.RefreshTokenTime, s.config.AccessTokenTime)
	if err != nil {
		return
	}

	expiresAt := time.Now().Add(s.config.RefreshTokenTime)
	_, err = s.repo.CreateSession(ctx, repo.CreateSessionParams{
		UserID:       userID,
		RefreshToken: refreshJTI,
		UserAgent:    r.Header.Get("User-Agent"),
		IpAddress:    r.RemoteAddr,
		ExpiresAt:    pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		return
	}

	s.setCookies(w, refreshToken, accessToken)
	return
}

func (s *authService) RotateSession(ctx context.Context, w http.ResponseWriter, r *http.Request, userID int64, sessionID pgtype.UUID) (err error) {
	refreshToken, accessToken, refreshJTI, _, err := utils.CreateTokens(userID, s.config.RefreshTokenKey, s.config.AccessTokenKey, s.config.RefreshTokenTime, s.config.AccessTokenTime)
	if err != nil {
		return
	}

	// Update the existing session row with the new RF's jti
	updateSessionParams := repo.UpdateSessionTokenParams{
		RefreshToken: refreshJTI,
		SessionID:    sessionID,
		ExpiresAt: pgtype.Timestamptz{
			Time:  time.Now().Add(s.config.RefreshTokenTime),
			Valid: true,
		},
	}
	err = s.repo.UpdateSessionToken(ctx, updateSessionParams)
	if err != nil {
		err = fmt.Errorf("could not update session on RotateSession %s", err)
		return
	}

	s.setCookies(w, refreshToken, accessToken)
	return
}

// CheckUserBlocked returns an error if the user's account has been blocked by an admin.
func (s *authService) CheckUserBlocked(ctx context.Context, userID int64) (err error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		err = fmt.Errorf("error fetching user inside CheckUserBlocked fn %s", err)
		return
	}

	if user.IsBlocked {
		return errors.New("user is blocked")
	}

	return
}

// LogoutUser revokes the session by access JTI and clears auth cookies.
func (s *authService) LogoutUser(ctx context.Context, w http.ResponseWriter, refreshJTI string) (err error) {
	if s.repo.DeleteSession(ctx, refreshJTI); err != nil {
		err = fmt.Errorf("error revoking user session inside LogoutUser fn %s", err)
		return
	}

	http.SetCookie(w, &http.Cookie{Name: "at", MaxAge: -1, Path: "/"})
	http.SetCookie(w, &http.Cookie{Name: "rf", MaxAge: -1, Path: "/"})

	return
}
