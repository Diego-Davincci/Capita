package posts

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/utils"
)

type postsController struct {
	service         Service
	uploaderService MediaService
}

func NewPostsController(service Service, uploaderService MediaService) *postsController {
	return &postsController{service: service, uploaderService: uploaderService}
}

func (c *postsController) HandlePost(w http.ResponseWriter, r *http.Request) {

	// ctx := r.Context()

	// Validate payload
	payload, file, validationErrs, err := c.service.ValidatePayload(r)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}
	if len(validationErrs) > 0 {
		utils.WriteResponse(w, http.StatusBadRequest, validationErrs, utils.ErrBadRequest.Error())
		return
	}
	fmt.Printf("%#v\n", payload)
	fmt.Printf("%#v\n", file)

	// Save media files to bucket

	// Create post

	utils.WriteResponse(w, http.StatusCreated, nil, "")
}
