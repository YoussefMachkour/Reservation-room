// cmd/server/main.go
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"room-reservation-api/internal/api/routes"
	"room-reservation-api/internal/config"
	"room-reservation-api/internal/database"
	"room-reservation-api/pkg/logger"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize configuration
	cfg := config.Load()

	// Initialize logger
	logger.Init(cfg.LogLevel)

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Printf("Failed to connect to database: %v\n", err)
		os.Exit(1)
	}

	// Initialize Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Setup routes
	routes.Setup(router, db, cfg)

	// Start server
	log.Printf("Starting server on port %s\n", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Printf("Failed to start server: %v\n", err)
		os.Exit(1)
	}
}
