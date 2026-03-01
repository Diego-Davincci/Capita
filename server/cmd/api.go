package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Diego-Davincci/Capita/internal/auth"
	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
	validatorMiddleware "github.com/Diego-Davincci/Capita/internal/middleware"
	"github.com/Diego-Davincci/Capita/internal/posts"
	"github.com/Diego-Davincci/Capita/internal/users"
	utils "github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type application struct {
	config          utils.Config
	db              *pgxpool.Pool
	uploaderService posts.MediaService
}

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	// TODO: add rate-limiter

	// Server rules
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{app.config.Website}, // Only this website domain can make http request to this server
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	// Good middleware stack
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer) // Making sure we can recover from panics
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Timeout(60 * time.Second)) // 1min Timeout for http requests

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteResponse(w, http.StatusOK, nil, "Everything OK 🔥")
	})

	// DB access
	repository := repo.New(app.db)

	// Auth routes
	oauth2Config := &oauth2.Config{
		ClientID:     app.config.GoogleClientID,
		ClientSecret: app.config.GoogleClientSecret,
		RedirectURL:  app.config.GoogleRedirectURL,
		Endpoint:     google.Endpoint,
		Scopes:       []string{"email", "profile"},
	}
	authService := auth.NewAuthService(repository, app.config, oauth2Config)
	authMiddleware := auth.NewAuthMiddleware(authService, repository, app.config)
	authController := auth.NewAuthController(authService, app.config)
	r.Route("/auth", func(r chi.Router) {
		r.Get("/google", authController.GoogleOauth)
		r.Get("/google/callback", authController.GoogleOauthCallback)
	})

	// Users routes
	usersService := users.NewUsersService(repository)
	usersController := users.NewUsersController(usersService)
	r.Route("/users", func(r chi.Router) {
		r.With(authMiddleware.Auth).Get("/me", usersController.Me)
		r.With(authMiddleware.Auth, validatorMiddleware.ValidateBody[users.CreateShopPayload]).Post("/me/shop", usersController.Shop)
	})

	// Post routes
	postsService := posts.NewPostsService(repository, app.config)
	postsController := posts.NewPostsController(postsService, app.uploaderService)
	r.Route("/posts", func(r chi.Router) {
		r.With(authMiddleware.Auth).Post("/", postsController.HandlePost)
		r.With(authMiddleware.Auth).Get("/", postsController.GetAllPosts)
	})

	return r
}

func (app *application) run(r http.Handler) error {
	srv := &http.Server{
		Addr:    app.config.Port,
		Handler: r,
		// Timeours when hitting endpoints
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 30,
		IdleTimeout:  time.Minute,
	}

	log.Printf("Server has started at %s", app.config.Port)

	return srv.ListenAndServe()
}
