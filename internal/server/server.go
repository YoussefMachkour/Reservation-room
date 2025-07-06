package server

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"room-reservation-api/internal/config"
	"room-reservation-api/internal/server/routes"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Server represents the HTTP server with all dependencies
type Server struct {
	router     *gin.Engine
	logger     *slog.Logger
	config     *config.Config
	db         *gorm.DB
	httpServer *http.Server
}

// New creates a new server instance with all dependencies
func New(cfg *config.Config, logger *slog.Logger, db *gorm.DB) *Server {
	// Configure Gin mode based on environment
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else if cfg.Environment == "development" {
		gin.SetMode(gin.DebugMode)
	}

	// Create Gin router
	router := gin.New()

	// Create server instance
	server := &Server{
		config: cfg,
		logger: logger,
		db:     db,
		router: router,
		httpServer: &http.Server{
			Addr:         ":" + cfg.Port,
			Handler:      router,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}

	// Setup middleware and routes
	server.setupMiddleware()
	server.setupRoutes()

	return server
}

// setupMiddleware configures global middleware for the server
func (s *Server) setupMiddleware() {
	// Recovery middleware - recovers from panics
	s.router.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		s.logger.Error("Panic recovered", "error", recovered)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_server_error",
			"message": "An unexpected error occurred",
		})
	}))

	// Request logging middleware for PFE demonstration
	s.router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return ""
	}))

	// Custom request logger for structured logging
	s.router.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log request details
		latency := time.Since(start)

		if raw != "" {
			path = path + "?" + raw
		}

		// Log different levels based on status code
		statusCode := c.Writer.Status()
		switch {
		case statusCode >= 500:
			s.logger.Error("HTTP Request",
				"method", c.Request.Method,
				"path", path,
				"status", statusCode,
				"latency", latency,
				"ip", c.ClientIP(),
			)
		case statusCode >= 400:
			s.logger.Warn("HTTP Request",
				"method", c.Request.Method,
				"path", path,
				"status", statusCode,
				"latency", latency,
				"ip", c.ClientIP(),
			)
		default:
			// Only log API calls, skip health checks in production
			if s.config.Environment != "production" || (path != "/health" && path != "/") {
				s.logger.Info("HTTP Request",
					"method", c.Request.Method,
					"path", path,
					"status", statusCode,
					"latency", latency,
					"ip", c.ClientIP(),
				)
			}
		}
	})

	// Security headers middleware
	s.router.Use(func(c *gin.Context) {
		// Basic security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")

		// API-specific headers
		c.Header("X-API-Version", "1.0.0")
		c.Header("X-Service", "Room-Reservation-API")

		c.Next()
	})

	s.logger.Info("✅ Middleware configured")
}

// setupRoutes initializes all application routes
func (s *Server) setupRoutes() {
	// Setup all routes using the routes package
	routes.Setup(s.router, s.db, s.config)

	// Add root endpoint for PFE demonstration
	s.router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":     "Room Reservation API",
			"version":     "1.0.0",
			"environment": s.config.Environment,
			"description": "Coworking Space Reservation System - PFE Project",
			"status":      "operational",
			"endpoints": gin.H{
				"health":        "GET /health",
				"documentation": "GET /api/docs",
				"authentication": gin.H{
					"register": "POST /api/v1/auth/register",
					"login":    "POST /api/v1/auth/login",
				},
				"spaces": gin.H{
					"list":         "GET /api/v1/spaces",
					"details":      "GET /api/v1/spaces/:id",
					"availability": "POST /api/v1/spaces/:id/availability",
				},
				"reservations": gin.H{
					"create":  "POST /api/v1/reservations",
					"my_list": "GET /api/v1/reservations/my",
					"checkin": "POST /api/v1/reservations/:id/checkin",
				},
			},
			"demo_credentials": gin.H{
				"admin": gin.H{
					"email":    "admin@cohub.com",
					"password": "password123",
					"role":     "admin",
				},
			},
		})
	})

	s.logger.Info("✅ Routes configured")
}

// Start starts the HTTP server
func (s *Server) Start() error {
	s.logger.Info("🚀 Starting HTTP server",
		"address", s.httpServer.Addr,
		"environment", s.config.Environment,
	)

	// Start server
	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		s.logger.Error("❌ Failed to start server", "error", err)
		return err
	}

	return nil
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("🛑 Shutting down HTTP server...")

	// Shutdown server with context timeout
	if err := s.httpServer.Shutdown(ctx); err != nil {
		s.logger.Error("❌ Server shutdown error", "error", err)
		return err
	}

	s.logger.Info("✅ HTTP server shutdown complete")
	return nil
}

// GetHTTPServer returns the underlying http.Server for graceful shutdown
func (s *Server) GetHTTPServer() *http.Server {
	return s.httpServer
}

// GetDB returns the database connection (useful for testing)
func (s *Server) GetDB() *gorm.DB {
	return s.db
}

// GetRouter returns the Gin router (useful for testing)
func (s *Server) GetRouter() *gin.Engine {
	return s.router
}

// GetConfig returns the server configuration
func (s *Server) GetConfig() *config.Config {
	return s.config
}

// Health check method for monitoring
func (s *Server) HealthCheck() map[string]interface{} {
	// Check database connection
	sqlDB, err := s.db.DB()
	dbStatus := "healthy"
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "unhealthy"
	}

	return map[string]interface{}{
		"service":     "Room Reservation API",
		"status":      "healthy",
		"environment": s.config.Environment,
		"timestamp":   time.Now().UTC(),
		"version":     "1.0.0",
		"components": map[string]interface{}{
			"database": dbStatus,
			"server":   "healthy",
		},
		"pfe_info": map[string]interface{}{
			"project":    "Coworking Space Reservation System",
			"author":     "Your Name",
			"features":   []string{"Authentication", "Space Management", "Reservations", "Check-in/out", "Admin Dashboard"},
			"demo_ready": true,
		},
	}
}
