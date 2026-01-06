package auth

import (
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/utils"
)

type authController struct {
	service Service
}

func NewAuthController(service Service) *authController {
	return &authController{service: service}
}

func (c *authController) GoogleOauth(w http.ResponseWriter, r *http.Request) {
	// googleCode := r.URL.Query().Get("code")

	utils.WriteResponse(w, http.StatusOK, nil, "Google Login OK")

}
