package posts

import (
	"log"
	"net/http"

	"github.com/Diego-Davincci/Capita/internal/middleware"
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

	ctx := r.Context()
	userID := ctx.Value(utils.UserContextKey).(int64)

	// Validate payload
	payload, mediaFile, validationErrs, err := c.service.ValidatePayload(r)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}
	if len(validationErrs) > 0 {
		log.Printf("validation errors when creating a post %+v", validationErrs)
		utils.WriteResponse(w, http.StatusBadRequest, validationErrs, utils.ErrBadRequest.Error())
		return
	}

	// Save media files to bucket
	fileUrl, err := c.uploaderService.UploadMedia(ctx, mediaFile, *payload.Media)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}

	// Create post
	post, err := c.service.CreatePost(ctx, userID, fileUrl, *payload)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}

	utils.WriteResponse(w, http.StatusCreated, post, "")
}

func (c *postsController) GetAllPosts(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()
	params := r.Context().Value(middleware.QueryCtxKey).(GetPostsQueries)

	posts, err := c.service.GetPosts(ctx, params.Category)
	if err != nil {
		log.Println(err)
		utils.WriteResponse(w, http.StatusInternalServerError, nil, utils.ErrInternalServerProblem.Error())
		return
	}

	utils.WriteResponse(w, http.StatusOK, posts, "")
}
