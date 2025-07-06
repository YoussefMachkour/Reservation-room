package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CustomCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}

		// Set CORS headers
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin, X-Requested-With, Cookie, client-type")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Type, Set-Cookie")
		c.Header("Access-Control-Max-Age", "86400")

		// Handle preflight with proper status code
		if c.Request.Method == "OPTIONS" {
			c.Header("Content-Type", "text/plain")
			c.Header("Content-Length", "0")
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}

		c.Next()
	}
}
