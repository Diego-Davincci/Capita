package main

import (
	"context"
	"log"

	"github.com/Diego-Davincci/Capita/internal/posts"
	utils "github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {

	// TODO : change aws CORS options

	// Application config
	apiConfig, err := utils.LoadConfig()
	if err != nil {
		log.Panic("Error loading env file", err)
	}
	// fmt.Printf("%#v\n", config)

	// Database
	ctx := context.Background() // Empty context to start DB pool connection
	dbConn, err := pgxpool.New(ctx, apiConfig.DBSource)
	if err != nil {
		log.Panicf("DB connection failed %s", err)
	}
	defer dbConn.Close()
	log.Println("DB connected successfully")

	// S3 setup
	uploaderService, err := posts.NewMediaUploaderService(apiConfig.BucketName, apiConfig.AWS_REGION, apiConfig.AWS_ACCESS_KEY_ID, apiConfig.AWS_SECRET_ACCESS_KEY)
	if err != nil {
		log.Panic(err)
	}
	log.Println("S3 connected successfully")

	// Create application struct
	app := application{
		config:          apiConfig,
		db:              dbConn,
		uploaderService: uploaderService,
	}

	if err := app.run(app.mount()); err != nil {
		log.Panicf("Server failed to start %s", err)
	}
}
