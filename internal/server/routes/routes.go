// routes/routes.go
package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"room-reservation-api/internal/config"
	"room-reservation-api/internal/handlers"
	"room-reservation-api/internal/middlewares"
	"room-reservation-api/internal/repositories"
	"room-reservation-api/internal/services"
)

func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// CORS middleware
	router.Use(middlewares.CustomCORS())

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	spaceRepo := repositories.NewSpaceRepository(db)
	reservationRepo := repositories.NewReservationRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret, time.Hour*24*7)
	spaceService := services.NewSpaceService(spaceRepo, reservationRepo, userRepo)
	reservationService := services.NewReservationService(reservationRepo, spaceRepo, userRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	statsHandler := handlers.NewStatsHandler(authService)
	spaceHandler := handlers.NewSpaceHandler(spaceService)
	reservationHandler := handlers.NewReservationHandler(reservationService)

	// API base group
	api := router.Group("/api/v1")

	// ========================================
	// PUBLIC ROUTES (No authentication required)
	// ========================================
	{
		// Authentication endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
		}

		// Public space information (for browsing/discovery)
		spaces := api.Group("/spaces")
		{
			spaces.GET("", spaceHandler.GetSpaces)                                // List all spaces
			spaces.GET("/:id", spaceHandler.GetSpace)                             // Space details
			spaces.GET("/search", spaceHandler.SearchSpaces)                      // Search with filters
			spaces.GET("/buildings", spaceHandler.GetBuildings)                   // Available buildings
			spaces.GET("/building/:building", spaceHandler.GetSpacesByBuilding)   // Spaces by building
			spaces.GET("/type/:type", spaceHandler.GetSpacesByType)               // Spaces by type
			spaces.GET("/available", spaceHandler.GetAvailableSpaces)             // Available spaces
			spaces.POST("/:id/availability", spaceHandler.CheckSpaceAvailability) // Check availability
		}
	}

	// ========================================
	// PROTECTED ROUTES (Authentication required)
	// ========================================
	protected := api.Group("")
	protected.Use(middlewares.AuthMiddleware(cfg.JWTSecret))
	{
		// User profile management
		protected.GET("/profile", authHandler.GetProfile)
		protected.PUT("/profile", authHandler.UpdateProfile)
		protected.PUT("/password", authHandler.ChangePassword)

		// Core reservation functionality
		reservations := protected.Group("/reservations")
		{
			// Basic CRUD operations
			reservations.POST("", reservationHandler.CreateReservation)            // Create reservation
			reservations.GET("/:id", reservationHandler.GetReservation)            // Get reservation details
			reservations.PUT("/:id", reservationHandler.UpdateReservation)         // Update reservation
			reservations.POST("/:id/cancel", reservationHandler.CancelReservation) // Cancel reservation

			// User's personal reservations
			reservations.GET("/my", reservationHandler.GetUserReservations)                  // My reservations
			reservations.GET("/my/upcoming", reservationHandler.GetUserUpcomingReservations) // Upcoming reservations
			reservations.GET("/my/active", reservationHandler.GetUserActiveReservation)      // Current active reservation

			// Check-in/Check-out functionality
			reservations.POST("/:id/checkin", reservationHandler.CheckIn)        // Check into space
			reservations.POST("/:id/checkout", reservationHandler.CheckOut)      // Check out of space
			reservations.GET("/:id/status", reservationHandler.GetCheckInStatus) // Check-in status

			// Search and filtering
			reservations.GET("/search", reservationHandler.SearchReservations)       // Advanced search
			reservations.GET("/calendar", reservationHandler.GetReservationCalendar) // Calendar view
		}

		// Space management for authenticated users
		userSpaces := protected.Group("/spaces")
		{
			userSpaces.POST("/batch-availability", spaceHandler.BatchCheckAvailability) // Batch availability check
		}
	}

	// ========================================
	// MANAGER ROUTES (Manager & Admin roles)
	// ========================================
	manager := protected.Group("/manager")
	manager.Use(middlewares.ManagerMiddleware())
	{
		// Space management for managers
		spaces := manager.Group("/spaces")
		{
			spaces.GET("/managed", spaceHandler.GetMyManagedSpaces)                  // Spaces I manage
			spaces.GET("/:id/reservations", reservationHandler.GetSpaceReservations) // Reservations for my space
			spaces.PUT("/:id/status", spaceHandler.UpdateSpaceStatus)                // Update space status
		}

		// Reservation approval workflow
		approvals := manager.Group("/approvals")
		{
			approvals.GET("", reservationHandler.GetPendingApprovals)             // Pending approvals
			approvals.POST("/:id/approve", reservationHandler.ApproveReservation) // Approve reservation
			approvals.POST("/:id/reject", reservationHandler.RejectReservation)   // Reject reservation
		}

		// Manager dashboard and statistics
		stats := manager.Group("/stats")
		{
			stats.GET("/dashboard", spaceHandler.GetDashboardStatistics) // Manager dashboard
			stats.GET("/spaces/:id", spaceHandler.GetSpaceStatistics)    // Individual space stats
		}
	}

	// ========================================
	// ADMIN ROUTES (Admin role only)
	// ========================================
	admin := protected.Group("/admin")
	admin.Use(middlewares.AdminMiddleware())
	{
		// User management
		users := admin.Group("/users")
		{
			users.GET("", authHandler.GetAllUsers)                   // List all users
			users.GET("/search", authHandler.SearchUsers)            // Search users
			users.PUT("/:id/role", authHandler.UpdateUserRole)       // Change user role
			users.PUT("/:id/activate", authHandler.ActivateUser)     // Activate user
			users.PUT("/:id/deactivate", authHandler.DeactivateUser) // Deactivate user
			users.DELETE("/:id", authHandler.DeleteUser)             // Delete user (soft delete)
		}

		// Space management (full CRUD)
		spaces := admin.Group("/spaces")
		{
			spaces.POST("", spaceHandler.CreateSpace)                            // Create new space
			spaces.PUT("/:id", spaceHandler.UpdateSpace)                         // Update space
			spaces.DELETE("/:id", spaceHandler.DeleteSpace)                      // Delete space
			spaces.POST("/:id/assign-manager", spaceHandler.AssignManager)       // Assign manager
			spaces.DELETE("/:id/unassign-manager", spaceHandler.UnassignManager) // Remove manager
			spaces.GET("/status/:status", spaceHandler.GetSpacesByStatus)        // Filter by status
		}

		// System-wide reservation management
		reservations := admin.Group("/reservations")
		{
			reservations.GET("", reservationHandler.GetAllReservations)                     // All reservations
			reservations.GET("/status/:status", reservationHandler.GetReservationsByStatus) // Filter by status
			reservations.DELETE("/:id", reservationHandler.DeleteReservation)               // Force delete
			reservations.POST("/:id/no-show", reservationHandler.MarkNoShow)                // Mark as no-show
		}

		// System statistics and monitoring
		stats := admin.Group("/stats")
		{
			stats.GET("", statsHandler.GetSystemStats)              // System overview
			stats.GET("/users", statsHandler.GetUserStats)          // User statistics
			stats.GET("/recent-users", statsHandler.GetRecentUsers) // Recent registrations
		}
	}

	// ========================================
	// UTILITY ENDPOINTS
	// ========================================

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
			"service":   "Room Reservation API",
		})
	})

	// API documentation
	router.GET("/api/docs", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":     "Room Reservation API",
			"version":     "1.0.0",
			"description": "Coworking Space Reservation System - PFE Project",
			"author":      "Your Name",
			"endpoints": gin.H{
				"public_endpoints": []string{
					"POST /api/v1/auth/login",
					"POST /api/v1/auth/register",
					"GET  /api/v1/spaces",
					"GET  /api/v1/spaces/available",
				},
				"user_endpoints": []string{
					"POST /api/v1/reservations",
					"GET  /api/v1/reservations/my",
					"POST /api/v1/reservations/:id/checkin",
				},
				"manager_endpoints": []string{
					"GET  /api/v1/manager/approvals",
					"POST /api/v1/manager/approvals/:id/approve",
				},
				"admin_endpoints": []string{
					"POST /api/v1/admin/spaces",
					"GET  /api/v1/admin/stats",
				},
			},
		})
	})

	// 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"error":   "endpoint_not_found",
			"message": "The requested endpoint does not exist",
			"path":    c.Request.URL.Path,
			"method":  c.Request.Method,
		})
	})
}

// ========================================
// MIDDLEWARE FUNCTIONS
// ========================================

// ManagerMiddleware ensures user has manager or admin role
func ManagerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(403, gin.H{
				"error":   "access_denied",
				"message": "User role not found",
			})
			c.Abort()
			return
		}

		role := userRole.(string)
		if role != "manager" && role != "admin" {
			c.JSON(403, gin.H{
				"error":   "access_denied",
				"message": "Manager or admin role required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminMiddleware ensures user has admin role
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(403, gin.H{
				"error":   "access_denied",
				"message": "User role not found",
			})
			c.Abort()
			return
		}

		if userRole.(string) != "admin" {
			c.JSON(403, gin.H{
				"error":   "access_denied",
				"message": "Admin role required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
