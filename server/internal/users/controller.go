package users

import (
	"log"
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/middleware"
	"github.com/Diego-Davincci/Capita/internal/utils"
)

type usersController struct {
	service Service
}

func NewUsersController(service Service) *usersController {
	return &usersController{service: service}
}

func (c *usersController) Me(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(utils.UserContextKey).(int64)

	user, err := c.service.GetUser(r.Context(), userID)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}

	utils.WriteResponse(w, http.StatusOK, user, "")
}

func (c *usersController) Shop(w http.ResponseWriter, r *http.Request) {
	payload := r.Context().Value(middleware.BodyCtxKey).(CreateShopPayload)
	userID := r.Context().Value(utils.UserContextKey).(int64)

	if err := c.service.CreateShop(r.Context(), userID, payload); err != nil {
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		log.Println(err)
		return
	}

	utils.WriteResponse(w, http.StatusCreated, nil, "Tienda creada exitosamente !")
}
