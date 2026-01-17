package posts

import (
	"context"
	"fmt"
	"io"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type MediaService interface {
	UploadMedia(ctx context.Context, file io.Reader, originalFilename string) (string, error)
}

type MediaUploaderService struct {
	client     *s3.Client
	bucketName string
	region     string
}

func NewMediaUploaderService(bucketName, region string) (MediaService, error) {
	cfg, loadErr := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if loadErr != nil {
		return nil, fmt.Errorf("can't init aws S3 connection: %w", loadErr)
	}

	return &MediaUploaderService{
		client:     s3.NewFromConfig(cfg),
		bucketName: bucketName,
		region:     region,
	}, nil
}

func (s *MediaUploaderService) UploadMedia(ctx context.Context, file io.Reader, originalFilename string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(originalFilename)
	filename := fmt.Sprintf("posts/%s%s", uuid.New().String(), ext)

	// Upload to S3
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(filename),
		Body:   file,
	})
	if err != nil {
		return "", fmt.Errorf("couldn't upload media file to s3: %w", err)
	}

	// Permanent URL
	url := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucketName, s.region, filename)

	return url, nil
}
