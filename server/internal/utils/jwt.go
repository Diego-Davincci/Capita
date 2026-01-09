package utils

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JwtUserData struct {
	jwt.RegisteredClaims
	UserID int64 `json:"userID"`
}

var (
	ErrExpiredToken = errors.New("token has expired")
	ErrInvalidToken = errors.New("token invalid")
)

// Create both refresh and access tokens
func CreateTokens(userID int64, refreshTokenKey, accessTokenKey string, refreshTokenTime, accessTokenTime time.Duration) (refreshToken, accessToken string, err error) {

	refreshTokenExpiryTime := jwt.NewNumericDate(time.Now().Add(refreshTokenTime))
	accessTokenExpiryTime := jwt.NewNumericDate(time.Now().Add(accessTokenTime))

	refreshTokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, JwtUserData{UserID: userID, RegisteredClaims: jwt.RegisteredClaims{
		Issuer:    "Cápita servers",
		ExpiresAt: refreshTokenExpiryTime,
	}})
	accessTokenClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, JwtUserData{UserID: userID, RegisteredClaims: jwt.RegisteredClaims{
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
