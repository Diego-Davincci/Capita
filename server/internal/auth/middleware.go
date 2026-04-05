package auth

import (
	"context"
	"log"
	"net/http"
	"time"

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
			ctx := context.WithValue(r.Context(), utils.UserContextKey, atClaims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// (4) - AT is expired, check now the refresh token, if it's invalid, send unauthorized
		rtClaims, rtErr := utils.ValidateToken(refreshToken.Value, m.config.RefreshTokenKey)
		if rtErr != nil && rtErr != utils.ErrExpiredToken {
			log.Println(rtErr)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// (5) access token is expired and maybe refresh token as well

		// Look up session
		session, sessionErr := m.repo.GetSessionByRefreshToken(r.Context(), rtClaims.ID)
		if sessionErr != nil {
			log.Println("session not found for refresh token jti")
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// Check session expiry - if expired, delete it and force re-login
		if session.ExpiresAt.Time.Before(time.Now()) {
			log.Printf("session has expired for user with session %#v\n", session)
			m.repo.DeleteSession(r.Context(), session.RefreshToken)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "petición no autorizada")
			return
		}

		// Fetch user, check is_blocked
		user, err := m.repo.GetUserByID(r.Context(), rtClaims.UserID)
		if err != nil {
			log.Println("error getting user by id", err)
			utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
			return
		}

		if user.IsBlocked {
			// Delete all sessions for this user
			m.repo.DeleteAllSessionsByUserID(r.Context(), user.UserID)
			utils.WriteResponse(w, http.StatusUnauthorized, nil, "Tu cuenta ha sido bloqueada. ¡Parece que te portaste muy mal! 🤡")
			return
		}

		// (6) Rotate: update existing session with new RT jti, issue new cookies
		if err := m.service.RotateSession(r.Context(), w, r, user.UserID, session.SessionID); err != nil {
			log.Println("error rotating session", err)
			utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
			return
		}

		ctx := context.WithValue(r.Context(), utils.UserContextKey, user.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))

	})
}
