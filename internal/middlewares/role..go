package middlewares

import (
	"net/http"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"

	"github.com/gin-gonic/gin"
)

// RequireRole middleware checks if user has any of the required roles
func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user role from context (set by AuthMiddleware)
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User role not found"))
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		userRoleStr := userRole.(models.UserRole)
		for _, role := range roles {
			if userRoleStr == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, dto.NewForbiddenError("Insufficient permissions"))
		c.Abort()
	}
}

// RequireAdmin middleware checks if user is an admin
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// RequireManager middleware checks if user is a manager or admin
func RequireManager() gin.HandlerFunc {
	return RequireRole(models.RoleManager, models.RoleAdmin)
}

// RequireOwnerOrAdmin middleware checks if user is the resource owner or admin
func RequireOwnerOrAdmin(getUserIDFromParam func(*gin.Context) (string, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get current user ID
		currentUserID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User not authenticated"))
			c.Abort()
			return
		}

		// Get user role
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User role not found"))
			c.Abort()
			return
		}

		// Admin can access everything
		if userRole.(models.UserRole) == models.RoleAdmin {
			c.Next()
			return
		}

		// Get target user ID from URL parameter
		targetUserID, err := getUserIDFromParam(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			c.Abort()
			return
		}

		// Check if current user is the owner
		if currentUserID.(string) == targetUserID {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, dto.NewForbiddenError("Access denied"))
		c.Abort()
	}
}

// RequireOwnerOrManagerOrAdmin middleware for resources that managers can also access
func RequireOwnerOrManagerOrAdmin(getUserIDFromParam func(*gin.Context) (string, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get current user ID
		currentUserID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User not authenticated"))
			c.Abort()
			return
		}

		// Get user role
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User role not found"))
			c.Abort()
			return
		}

		userRoleEnum := userRole.(models.UserRole)

		// Admin and managers can access everything
		if userRoleEnum == models.RoleAdmin || userRoleEnum == models.RoleManager {
			c.Next()
			return
		}

		// Get target user ID from URL parameter
		targetUserID, err := getUserIDFromParam(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			c.Abort()
			return
		}

		// Check if current user is the owner
		if currentUserID.(string) == targetUserID {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, dto.NewForbiddenError("Access denied"))
		c.Abort()
	}
}

// Helper function to extract user ID from URL parameter
func GetUserIDFromParam(c *gin.Context) (string, error) {
	return c.Param("id"), nil
}

// Helper function to extract user ID from different parameter names
func GetUserIDFromParamName(paramName string) func(*gin.Context) (string, error) {
	return func(c *gin.Context) (string, error) {
		return c.Param(paramName), nil
	}
}
