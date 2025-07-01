package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"room-reservation-api/internal/api/middleware"
	"room-reservation-api/internal/config"
)

func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Initialize handlers
	// authHandler := handlers.NewAuthHandler(db, cfg)
	// workspaceHandler := handlers.NewWorkspaceHandler(db)
	// bookingHandler := handlers.NewBookingHandler(db)

	// Public routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		// auth := api.Group("/auth")
		{
			// auth.POST("/register", authHandler.Register)
			// auth.POST("/login", authHandler.Login)
		}

		// Public workspace routes
		// workspaces := api.Group("/workspaces")
		{
			// workspaces.GET("", workspaceHandler.GetWorkspaces)
			// workspaces.GET("/:id", workspaceHandler.GetWorkspace)
		}
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// User profile
		// protected.GET("/profile", authHandler.GetProfile)

		// Bookings
		// bookings := protected.Group("/bookings")
		// {
		// 	bookings.POST("", bookingHandler.CreateBooking)
		// 	bookings.GET("", bookingHandler.GetUserBookings)
		// 	bookings.GET("/:id", bookingHandler.GetBooking)
		// 	bookings.PUT("/:id/cancel", bookingHandler.CancelBooking)
		// }

		// // Admin workspace management
		// admin := protected.Group("/admin")
		// {
		// 	admin.POST("/workspaces", workspaceHandler.CreateWorkspace)
		// 	admin.PUT("/workspaces/:id", workspaceHandler.UpdateWorkspace)
		// 	admin.DELETE("/workspaces/:id", workspaceHandler.DeleteWorkspace)
		// }
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
