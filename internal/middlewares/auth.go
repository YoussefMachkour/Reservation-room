package middlewares

import (
	"net/http"
	"strings"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT token and sets user info in context
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Authorization header required"))
			c.Abort()
			return
		}

		// Check if header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Invalid authorization header format"))
			c.Abort()
			return
		}

		// Extract token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Token is required"))
			c.Abort()
			return
		}

		// Validate token
		claims, err := utils.ValidateJWT(token, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Invalid or expired token"))
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID.String())
		c.Set("user_role", claims.Role)
		c.Set("token_claims", claims)

		c.Next()
	}
}

// OptionalAuth middleware - validates token if present but doesn't require it
func OptionalAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.Next()
			return
		}

		claims, err := utils.ValidateJWT(token, jwtSecret)
		if err != nil {
			// Don't abort, just continue without user info
			c.Next()
			return
		}

		// Set user info in context if token is valid
		c.Set("user_id", claims.UserID.String())
		c.Set("user_role", claims.Role)
		c.Set("token_claims", claims)

		c.Next()
	}
}
