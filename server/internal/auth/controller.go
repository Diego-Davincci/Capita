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

	errRedirectURL := fmt.Sprintf("%s/login?err='problem with google login'", c.config.Website)

	// Get google user data using oauth2
	googleUser, err := c.service.GetGoogleUserData(r.Context(), googleCode)
	if err != nil {
		log.Println(err)
		http.Redirect(w, r, errRedirectURL, http.StatusSeeOther)
		return
	}

	// Validate user email belongs to school
	err = c.service.CheckUserEmail(googleUser.Email)
	if err != nil {
		log.Println(err)
		log.Println(c.config.Website)
		http.Redirect(w, r, errRedirectURL, http.StatusSeeOther)
		return
	}

	// Create/Update user
	user, err := c.service.UpsertUser(r.Context(), googleUser)
	if err != nil {
		log.Println(err)
		http.Redirect(w, r, errRedirectURL, http.StatusSeeOther)
		return
	}

	// Create access and refresh tokens and set cookies
	if err = c.service.SetAuthCookies(w, user.UserID); err != nil {
		log.Println(err)
		http.Redirect(w, r, errRedirectURL, http.StatusSeeOther)
		return
	}

	http.Redirect(w, r, c.config.Website, http.StatusSeeOther)
}

func (c *authController) Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(utils.UserContextKey).(int64)
	// log.Println("user id", userID)

	user, err := c.service.GetUser(r.Context(), userID)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}

	utils.WriteResponse(w, http.StatusOK, user, "")
}

func (c *authController) Logout(w http.ResponseWriter, r *http.Request) {
	utils.WriteResponse(w, http.StatusOK, nil, "")
}
