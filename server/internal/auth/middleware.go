package auth

import (
	"context"
	"log"
	"net/http"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	"github.com/Diego-Davincci/Capita/internal/utils"
)

type middleware struct {
	repo    repo.Querier
	service Service
	config  utils.Config
}

func NewAuthMiddleware(service Service, repo repo.Querier, config utils.Config) *middleware {
	return &middleware{service: service, config: config, repo: repo}
}

func (m *middleware) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// (1) - Get both access and refresh tokens
		refreshToken, err := r.Cookie("rt")
		if err != nil {
			log.Println("no rt cookie present", err)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}
		accessToken, err := r.Cookie("at")
		if err != nil {
			log.Println("no at cookie present", err)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// (2) - Validate AT signature
		atClaims, atErr := utils.ValidateToken(accessToken.Value, m.config.AccessTokenKey)
		if atErr == utils.ErrInvalidToken {
			log.Println(atErr)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// (3) AT is valid — NO DB hit, trust the JWT signature + short expiry
		if atErr == nil {
			// Still need 'at id' in context for logout. Read it from the AT claims.
			atClaims, _ := utils.ValidateToken(accessToken.Value, m.config.AccessTokenKey)
			ctx := context.WithValue(r.Context(), utils.UserContextKey, atClaims.UserID)
			ctx = context.WithValue(ctx, utils.SessionIDContextKey, atClaims.ID) // access JTI
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// (4) - AT is expired, check now the refresh token, if it's invalid, send unauthorized
		rtClaims, rtErr := utils.ValidateToken(refreshToken.Value, m.config.RefreshTokenKey)
		if rtErr != nil {
			log.Println(rtErr)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// (5) If access token is expired, create both new tokens
		if atErr == utils.ErrExpiredToken {
			// Get User
			user, err := m.repo.GetUserByID(r.Context(), rtClaims.UserID)
			if err != nil {
				log.Println("error getting user by id", err)
				utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
				return
			}

			// Revoke the current session - if it fails don't throw 5xx error, just print message
			revokeSessionErr := m.repo.RevokeSessionByAccessJTI(r.Context(), atClaims.ID)
			if revokeSessionErr != nil {
				log.Printf("could not revoke this user session %#v\n", user)
			}

			// Check if user is blocked
			if user.IsBlocked {
				log.Printf("user is blocked %#v\n", user)
				utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
				return
			}

			// (6) Issue new tokens + create new session (full rotation)
			sessionID, err := m.service.SetAuthCookies(r.Context(), w, r, user.UserID)
			if err != nil {
				log.Println("error setting auth cookies", err)
				utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
				return
			}

			ctx := context.WithValue(r.Context(), utils.UserContextKey, user.UserID)
			ctx = context.WithValue(ctx, utils.SessionIDContextKey, sessionID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return

		}

	})
}
