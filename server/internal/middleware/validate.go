package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/gorilla/schema"
)

// contextKey is an unexported type to prevent context key collisions.
type contextKey string

const (
	// BodyCtxKey is the context key under which the validated body is stored.
	BodyCtxKey contextKey = "validated_body"
	// QueryCtxKey is the context key under which the validated query params are stored.
	QueryCtxKey contextKey = "validated_query"
)

var queryDecoder = schema.NewDecoder()

// ValidateBody decodes the JSON request body into T, runs struct validation
// using utils.ValidateData, and stores the result in the request context under BodyCtxKey.
// Returns 400 if the body cannot be decoded and with field errors if validation fails.
//
// Usage:  r.With(appMW.ValidateBody[users.CreateShopPayload]).Post("/me/shop", ctrl.Shop)
// Read:   payload := r.Context().Value(appMW.BodyCtxKey).(T)
//
// Test cases:
// - Valid body → calls next and stores payload in context
// - Malformed JSON → 400
// - Valid JSON but failing validation → 400 with []CustomValidationError
func ValidateBody[T any](next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var payload T

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			utils.WriteResponse(w, http.StatusBadRequest, nil, utils.ErrBadRequest.Error())
			return
		}

		if fieldErrs := utils.ValidateData(payload); fieldErrs != nil {
			utils.WriteResponse(w, http.StatusBadRequest, fieldErrs, utils.ErrBadRequest.Error())
			return
		}

		ctx := context.WithValue(r.Context(), BodyCtxKey, payload)
		next.ServeHTTP(w, r.WithContext(ctx))

	})
}

// ValidateQuery decodes URL query parameters into T via gorilla/schema
// (struct fields need a `schema:"param_name"` tag), runs struct validation,
// and stores the result in the request context under QueryCtxKey.
// Returns 400 if the query string cannot be decoded and with field errors if validation fails.
//
// Usage:  r.With(appMW.ValidateQuery[GetPostsParams]).Get("/posts", ctrl.GetAll)
// Read:   params := r.Context().Value(appMW.QueryCtxKey).(T)
//
// Test cases:
// - Valid query params → calls next and stores params in context
// - Bad query params → 400
// - Valid params but failing validation → 400 with []CustomValidationError
func ValidateQuery[T any](next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var params T

		if err := queryDecoder.Decode(&params, r.URL.Query()); err != nil {
			log.Println("decoding problem", err)
			utils.WriteResponse(w, http.StatusBadRequest, nil, utils.ErrBadRequest.Error())
			return
		}

		if fieldErrs := utils.ValidateData(params); fieldErrs != nil {
			log.Println(fieldErrs)
			utils.WriteResponse(w, http.StatusBadRequest, fieldErrs, utils.ErrBadRequest.Error())
			return
		}

		ctx := context.WithValue(r.Context(), QueryCtxKey, params)
		next.ServeHTTP(w, r.WithContext(ctx))

	})
}
