package posts

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type MediaService interface {
	UploadMedia(ctx context.Context, mediaFile multipart.File, mediaFileHeaders multipart.FileHeader) (fileUrl string, err error)
}

type MediaUploaderService struct {
	client     *s3.Client
	bucketName string
	region     string
	acessKey   string
	secretKey  string
}

func NewMediaUploaderService(bucketName, region, accessKey, secretKey string) (MediaService, error) {
	cfg, loadErr := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region), config.WithCredentialsProvider(aws.NewCredentialsCache(
		credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
	)))
	if loadErr != nil {
		return nil, fmt.Errorf("can't init aws S3 connection: %w", loadErr)
	}

	return &MediaUploaderService{
		client:     s3.NewFromConfig(cfg),
		bucketName: bucketName,
		region:     region,
		acessKey:   accessKey,
		secretKey:  secretKey,
	}, nil
}

func (s *MediaUploaderService) UploadMedia(ctx context.Context, mediaFile multipart.File, mediaFileHeaders multipart.FileHeader) (fileUrl string, err error) {

	defer mediaFile.Close() // Close the temporary file to free-up system memory after making sure it's saved on s3

	// Generate unique filename
	ext := filepath.Ext(mediaFileHeaders.Filename)
	filename := fmt.Sprintf("posts/%s%s", uuid.New().String(), ext)

	contentLength := aws.Int64(mediaFileHeaders.Size)
	contentType := mediaFileHeaders.Header.Get("Content-Type")

	// Upload to S3
	_, uploadErr := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucketName),
		Key:           aws.String(filename),
		Body:          mediaFile,
		ContentLength: contentLength,
		ContentType:   &contentType,
	})
	if uploadErr != nil {
		err = fmt.Errorf("couldn't upload media file to s3: %w", uploadErr)
		return
	}

	// Permanent URL
	fileUrl = fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucketName, s.region, filename)

	return
}
