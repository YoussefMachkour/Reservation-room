package handlers

import (
	"net/http"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/services"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	authService *services.AuthService
}

func NewStatsHandler(authService *services.AuthService) *StatsHandler {
	return &StatsHandler{
		authService: authService,
	}
}

// GetSystemStats returns system statistics for admin dashboard
func (h *StatsHandler) GetSystemStats(c *gin.Context) {
	userStats, err := h.authService.GetUserStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to get user statistics"))
		return
	}

	stats := map[string]interface{}{
		"users": userStats,
		// TODO: Add more stats when other domains are implemented
		// "spaces": spaceStats,
		// "reservations": reservationStats,
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponse("System statistics retrieved successfully", stats))
}

// GetUserStats returns detailed user statistics
func (h *StatsHandler) GetUserStats(c *gin.Context) {
	userStats, err := h.authService.GetUserStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to get user statistics"))
		return
	}

	c.JSON(http.StatusOK, dto.NewSuccessResponse("User statistics retrieved successfully", userStats))
}

// GetRecentUsers returns recently registered users
func (h *StatsHandler) GetRecentUsers(c *gin.Context) {
	days := 30 // Default to last 30 days
	if d := c.Query("days"); d != "" {
		// Parse days parameter if provided
		// For simplicity, using default for now
	}

	limit := 10
	offset := 0

	users, total, err := h.authService.GetRecentUsers(days, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to get recent users"))
		return
	}

	userResponses := make([]dto.UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = dto.ToUserResponse(&user)
	}

	response := dto.NewPaginatedResponse(userResponses, total, 1, limit)
	c.JSON(http.StatusOK, response)
}
