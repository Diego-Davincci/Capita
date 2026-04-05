package utils

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrExpiredToken = errors.New("token has expired")
	ErrInvalidToken = errors.New("token invalid")
)

// JwtUserData holds the JWT claims for Cápita tokens.
// The JTI (unique token ID) is stored in RegisteredClaims.ID.
type JwtUserData struct {
	jwt.RegisteredClaims
	UserID int64 `json:"userID"`
}

// CreateTokens creates a refresh token + access token pair.
// Returns the signed token strings and their JTI UUIDs (used for session tracking).
func CreateTokens(userID int64, refreshTokenKey, accessTokenKey string, refreshTokenTime, accessTokenTime time.Duration) (refreshToken, accessToken, refreshJTI, accessJTI string, err error) {

	refreshJTI = uuid.NewString()
	accessJTI = uuid.NewString()

	refreshTokenExpiryTime := jwt.NewNumericDate(time.Now().Add(refreshTokenTime))
	accessTokenExpiryTime := jwt.NewNumericDate(time.Now().Add(accessTokenTime))

	refreshTokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, JwtUserData{UserID: userID, RegisteredClaims: jwt.RegisteredClaims{
		ID:        refreshJTI, // jti claim
		Issuer:    "Cápita servers",
		ExpiresAt: refreshTokenExpiryTime,
	}})
	accessTokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, JwtUserData{UserID: userID, RegisteredClaims: jwt.RegisteredClaims{
		ID:        accessJTI, // jti claim
		Issuer:    "Cápita servers",
		ExpiresAt: accessTokenExpiryTime,
	}})

	// log.Println("refresh token key", refreshTokenKey, "\naccess token key\n", accessTokenKey)

	refreshToken, err = refreshTokenClaims.SignedString([]byte(refreshTokenKey))
	if err != nil {
		err = fmt.Errorf("error creating refresh token %s", err)
		return
	}
	accessToken, err = accessTokenClaims.SignedString([]byte(accessTokenKey))
	if err != nil {
		err = fmt.Errorf("error creating access token %s", err)
		return
	}

	return
}

func ValidateToken(tokenString, key string) (JwtUserData, error) {

	// Check if HS256 signature is correct
	keyFunc := func(token *jwt.Token) (interface{}, error) {
		_, ok := token.Method.(*jwt.SigningMethodHMAC)
		if !ok {
			log.Println("token signature is not correct")
			return nil, ErrInvalidToken
		}
		return []byte(key), nil
	}

	// Check if signing key is correct
	token, err := jwt.ParseWithClaims(tokenString, &JwtUserData{}, keyFunc)
	if err != nil {

		// Check if token is expired
		if errors.Is(err, jwt.ErrTokenExpired) {
			// log.Println("token has expired")
			return JwtUserData{}, ErrExpiredToken
		}

		log.Println("token is not signed correctly", err)
		return JwtUserData{}, ErrInvalidToken
	}

	// Check if overall token is valid
	if !token.Valid {
		log.Println("token is not valid")
		return JwtUserData{}, ErrInvalidToken
	}

	// Check is token is expired
	claims, ok := token.Claims.(*JwtUserData)
	if !ok {
		log.Println("token is not valid")
		return JwtUserData{}, ErrInvalidToken
	}

	return *claims, nil
}
