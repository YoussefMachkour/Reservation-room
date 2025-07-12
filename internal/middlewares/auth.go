package middlewares

import (
	"log"
	"net/http"
	"strings"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT token and sets user info in context
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add debug logging to track exactly where the failure occurs
		log.Printf("Auth middleware triggered for: %s %s", c.Request.Method, c.Request.URL.Path)

		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		log.Printf("Authorization header received: '%s'", authHeader) // Debug log

		if authHeader == "" {
			log.Printf("❌ No authorization header provided")
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Authorization header required"))
			c.Abort()
			return
		}

		// Check if header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Printf("❌ Invalid authorization header format: '%s'", authHeader)
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Invalid authorization header format"))
			c.Abort()
			return
		}

		// Extract token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		log.Printf("Extracted token length: %d", len(token))            // Debug log
		log.Printf("Token preview: %s...", token[:min(20, len(token))]) // First 20 chars only

		if token == "" {
			log.Printf("❌ Empty token after Bearer prefix")
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Token is required"))
			c.Abort()
			return
		}

		// Validate token
		log.Printf("Attempting to validate JWT token...")
		claims, err := utils.ValidateJWT(token, jwtSecret)
		if err != nil {
			log.Printf("❌ JWT validation failed: %v", err) // This is likely where it's failing
			c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("Invalid or expired token"))
			c.Abort()
			return
		}

		log.Printf("✅ JWT validation successful for user: %s", claims.UserID.String())

		// Set user info in context
		c.Set("user_id", claims.UserID.String())
		c.Set("user_role", claims.Role)
		c.Set("token_claims", claims)

		log.Printf("✅ Auth middleware completed successfully")
		c.Next()
	}
}

// Helper function for Go versions that don't have min built-in
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
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
