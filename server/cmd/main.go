package main

import (
	"context"
	"log"

	utils "github.com/Diego-Davincci/Capita/internal/utils"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Application config
	config, err := utils.LoadConfig()
	if err != nil {
		log.Panic("Error loading env file", err)
	}
	// fmt.Printf("%#v\n", config)

	// Database
	ctx := context.Background() // Empty context to start DB pool connection
	dbConn, err := pgxpool.New(ctx, config.DBSource)
	if err != nil {
		log.Panic("DB connection failed")
	}
	defer dbConn.Close()
	log.Println("DB connected successfully")

	// Create application struct
	app := application{
		config: config,
		db:     dbConn,
	}

	if err := app.run(app.mount()); err != nil {
		log.Panicf("Server failed to start %s", err)
	}
}
