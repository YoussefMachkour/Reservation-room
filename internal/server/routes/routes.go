package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"room-reservation-api/internal/config"
	handlers "room-reservation-api/internal/handelers"
	middleware "room-reservation-api/internal/middlewares"
	"room-reservation-api/internal/repositories"
	"room-reservation-api/internal/services"
)

func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// CORS middleware
	router.Use(middleware.CustomCORS())

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret, time.Hour*24*7)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	statsHandler := handlers.NewStatsHandler(authService)
	// workspaceHandler := handlers.NewWorkspaceHandler(db)
	// bookingHandler := handlers.NewBookingHandler(db)

	// Public routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
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
		// User profile - READY TO USE
		protected.GET("/profile", authHandler.GetProfile)
		protected.PUT("/profile", authHandler.UpdateProfile)
		protected.PUT("/password", authHandler.ChangePassword)

		// Bookings
		// bookings := protected.Group("/bookings")
		// {
		// 	bookings.POST("", bookingHandler.CreateBooking)
		// 	bookings.GET("", bookingHandler.GetUserBookings)
		// 	bookings.GET("/:id", bookingHandler.GetBooking)
		// 	bookings.PUT("/:id/cancel", bookingHandler.CancelBooking)
		// }

		// Admin workspace management
		admin := protected.Group("/admin")
		// {
		// User management - READY TO USE
		admin.GET("/users", authHandler.GetAllUsers)
		admin.GET("/users/search", authHandler.SearchUsers)
		admin.PUT("/users/:id/role", authHandler.UpdateUserRole)
		admin.PUT("/users/:id/activate", authHandler.ActivateUser)
		admin.PUT("/users/:id/deactivate", authHandler.DeactivateUser)
		admin.DELETE("/users/:id", authHandler.DeleteUser)

		// System stats - READY TO USE
		admin.GET("/stats", statsHandler.GetSystemStats)
		admin.GET("/stats/users", statsHandler.GetUserStats)
		admin.GET("/stats/recent-users", statsHandler.GetRecentUsers)
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
