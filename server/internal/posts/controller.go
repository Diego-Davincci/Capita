package posts

import (
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/utils"
)

type postsController struct {
	service Service
}

func NewPostsController(service Service) *postsController {
	return &postsController{service: service}
}

func (c *postsController) HandlePosts(w http.ResponseWriter, r *http.Request) {
	utils.WriteResponse(w, http.StatusCreated, nil, "")
}
