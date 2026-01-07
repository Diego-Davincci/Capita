package auth

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/utils"
)

type authController struct {
	service Service
	config  utils.Config
}

func NewAuthController(service Service, config utils.Config) *authController {
	return &authController{service: service, config: config}
}

func (c *authController) GoogleOauth(w http.ResponseWriter, r *http.Request) {
	url := c.service.RedirectToGoogleUrl()
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (c *authController) GoogleOauthCallback(w http.ResponseWriter, r *http.Request) {
	googleCode := r.URL.Query().Get("code")

	// Get google user data using oauth2
	_, err := c.service.GetGoogleUserData(googleCode, r.Context())
	if err != nil {
		log.Println("Problems getting google user tokens", err)
		http.Redirect(w, r, fmt.Sprintf("%s/login?err='problem with google login'", c.config.Website), http.StatusSeeOther)
		return
	}

	// Create/Update user

	// Create access and refresh tokens

	utils.WriteResponse(w, http.StatusOK, nil, "Google Login OK")
}
