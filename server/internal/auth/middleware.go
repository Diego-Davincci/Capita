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
		// Get both access and refresh tokens
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

		// Check first access token, if token is invalid, send unauthorized
		_, atErr := utils.ValidateToken(accessToken.Value, m.config.AccessTokenKey)
		if atErr == utils.ErrInvalidToken {
			log.Println(atErr)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// Check second the refresh token, if it's invalid, send unauthorized
		rtClaims, rtErr := utils.ValidateToken(refreshToken.Value, m.config.RefreshTokenKey)
		if rtErr != nil {
			log.Println(rtErr)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// If access token is expired, create both new tokens
		if atErr == utils.ErrExpiredToken {
			// Get User
			user, err := m.repo.GetUserByID(r.Context(), rtClaims.UserID)
			if err != nil {
				log.Println("error getting user by id", err)
				utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
				return
			}

			// Check in the DB user is valid
			if !user.IsUserValid {
				log.Printf("user is not valid %#v\n", user)
				utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
				return
			}

			// Set new auth cookies with new tokens
			if err := m.service.SetAuthCookies(w, user.UserID); err != nil {
				log.Println("error setting auth cookies", err)
				utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
				return
			}

			ctx := context.WithValue(r.Context(), utils.UserContextKey, user.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return

		}

		ctx := context.WithValue(r.Context(), utils.UserContextKey, rtClaims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))

	})
}
