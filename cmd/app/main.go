package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"room-reservation-api/internal/config"
	"room-reservation-api/internal/database"
	"room-reservation-api/internal/server"
)

func gracefulShutdown(apiServer *http.Server, done chan bool) {
	// Create context that listens for the interrupt signal from the OS
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal
	<-ctx.Done()

	log.Println("🛑 Shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// Give the server 10 seconds to finish current requests
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := apiServer.Shutdown(ctx); err != nil {
		log.Printf("❌ Server forced to shutdown with error: %v", err)
	}

	log.Println("✅ Server shutdown complete")
	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {
	// Initialize structured logger
	logLevel := slog.LevelInfo
	if os.Getenv("DEBUG") == "true" {
		logLevel = slog.LevelDebug
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	// Set as default logger
	slog.SetDefault(logger)

	logger.Info("🚀 Starting Room Reservation API - PFE Project")

	// Load configuration
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		logger.Error("❌ Invalid configuration", "error", err)
		os.Exit(1)
	}

	logger.Info("✅ Configuration loaded",
		"environment", cfg.Environment,
		"port", cfg.Port,
	)

	// Initialize database connection
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		logger.Error("❌ Failed to connect to database", "error", err)
		os.Exit(1)
	}

	logger.Info("✅ Database connected successfully")

	// Seed database with initial data (admin user + sample spaces)
	if err := database.SeedDatabase(db); err != nil {
		logger.Warn("⚠️  Failed to seed database", "error", err)
	} else {
		logger.Info("🌱 Database seeded with initial data")
	}

	// Create database constraints for data integrity
	if err := database.CreateUniqueConstraints(db); err != nil {
		logger.Warn("⚠️  Failed to create database constraints", "error", err)
	}

	// Initialize server with all dependencies
	serverInstance := server.New(cfg, logger, db)

	logger.Info("🎯 Server initialized successfully")
	logger.Info("📊 PFE Demo Features Available:",
		"auth", "✅ User Registration/Login",
		"spaces", "✅ Space Management",
		"reservations", "✅ Booking System",
		"checkin", "✅ Check-in/Check-out",
		"approval", "✅ Manager Approval Workflow",
		"admin", "✅ Admin Dashboard",
	)

	// Display useful endpoints for PFE demonstration
	logger.Info("🔗 Key Demo Endpoints:",
		"docs", "GET /api/docs",
		"register", "POST /api/v1/auth/register",
		"login", "POST /api/v1/auth/login",
		"spaces", "GET /api/v1/spaces",
		"book", "POST /api/v1/reservations",
		"health", "GET /health",
	)

	logger.Info("🎉 Room Reservation System Ready!",
		"url", "http://localhost:"+cfg.Port,
		"environment", cfg.Environment,
	)

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(serverInstance.GetHTTPServer(), done)

	// Start the server
	if err := serverInstance.Start(); err != nil && err != http.ErrServerClosed {
		logger.Error("❌ Server startup error", "error", err)

		// Attempt to close database connection before exit
		if dbErr := database.CloseConnection(db); dbErr != nil {
			logger.Error("❌ Failed to close database connection", "error", dbErr)
		}

		os.Exit(1)
	}

	// Wait for the graceful shutdown to complete
	<-done

	// Clean up resources
	if err := database.CloseConnection(db); err != nil {
		logger.Error("❌ Failed to close database connection", "error", err)
	} else {
		logger.Info("✅ Database connection closed")
	}

	logger.Info("🎯 Room Reservation API shutdown complete - PFE Demo End")
}
