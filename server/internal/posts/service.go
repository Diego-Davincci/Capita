package posts

import (
	"context"

	repo "github.com/Diego-Davincci/Capita/internal/db/sqlc"
)

type Service interface {
	CreatePost(ctx context.Context)
}

type postsService struct {
	repo repo.Querier
}

func NewPostsService(repo repo.Querier) Service {
	return &postsService{repo: repo}
}

func (s *postsService) CreatePost(ctx context.Context) {

}
