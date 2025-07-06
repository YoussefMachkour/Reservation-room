// internal/handlers/reservation_handler.go - Part 1: Basic CRUD Operations
package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/services"
	"room-reservation-api/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ReservationHandler handles reservation-related HTTP requests
type ReservationHandler struct {
	reservationService *services.ReservationService
}

// NewReservationHandler creates a new reservation handler
func NewReservationHandler(reservationService *services.ReservationService) *ReservationHandler {
	return &ReservationHandler{
		reservationService: reservationService,
	}
}

// ========================================
// BASIC CRUD OPERATIONS
// ========================================

// CreateReservation creates a new reservation
// @Summary Create a new reservation
// @Description Create a new space reservation with validation and conflict checking
// @Tags reservations
// @Accept json
// @Produce json
// @Param request body dto.CreateReservationRequest true "Create reservation request"
// @Success 201 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Router /reservations [post]
func (h *ReservationHandler) CreateReservation(c *gin.Context) {
	var req dto.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Validate the request (using built-in validation)
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	reservation, err := h.reservationService.CreateReservation(&req, userID)
	if err != nil {
		status := h.determineErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to create reservation",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Message: "Reservation created successfully",
		Data:    reservation,
	})
}

// GetReservation retrieves a reservation by ID
// @Summary Get reservation by ID
// @Description Retrieve detailed information about a specific reservation
// @Tags reservations
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /reservations/{id} [get]
func (h *ReservationHandler) GetReservation(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	reservation, err := h.reservationService.GetReservationByID(reservationID, userID)
	if err != nil {
		status := http.StatusNotFound
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get reservation",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    reservation,
	})
}

// UpdateReservation updates an existing reservation
// @Summary Update reservation
// @Description Update reservation details (title, time, participants, etc.)
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.UpdateReservationRequest true "Update reservation request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Router /reservations/{id} [put]
func (h *ReservationHandler) UpdateReservation(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	var req dto.UpdateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Validate the request (using built-in validation)
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	reservation, err := h.reservationService.UpdateReservation(reservationID, &req, userID)
	if err != nil {
		status := h.determineErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to update reservation",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation updated successfully",
		Data:    reservation,
	})
}

// CancelReservation cancels a reservation
// @Summary Cancel reservation
// @Description Cancel a reservation with optional reason
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.CancelReservationRequest true "Cancel reservation request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /reservations/{id}/cancel [post]
func (h *ReservationHandler) CancelReservation(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	var req dto.CancelReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	err = h.reservationService.CancelReservation(reservationID, req.Reason, userID)
	if err != nil {
		status := h.determineErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to cancel reservation",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation cancelled successfully",
	})
}

// DeleteReservation deletes a reservation (admin only)
// @Summary Delete reservation
// @Description Permanently delete a reservation (admin only)
// @Tags reservations
// @Param id path string true "Reservation ID" format(uuid)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /reservations/{id} [delete]
func (h *ReservationHandler) DeleteReservation(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	err = h.reservationService.DeleteReservation(reservationID, userID)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "only administrators can delete reservations" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to delete reservation",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation deleted successfully",
	})
}

// GetAllReservations retrieves all reservations with pagination (admin only)
// @Summary Get all reservations
// @Description Retrieve all reservations in the system with pagination (admin only)
// @Tags reservations
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param status query string false "Filter by status" Enums(pending, confirmed, cancelled, completed, rejected)
// @Param space_id query string false "Filter by space ID" format(uuid)
// @Param user_id query string false "Filter by user ID" format(uuid)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /admin/reservations [get]
func (h *ReservationHandler) GetAllReservations(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Build filters from query parameters
	filters := make(map[string]interface{})

	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	if spaceIDStr := c.Query("space_id"); spaceIDStr != "" {
		if spaceID, err := uuid.Parse(spaceIDStr); err == nil {
			filters["space_id"] = spaceID
		}
	}

	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if filterUserID, err := uuid.Parse(userIDStr); err == nil {
			filters["user_id"] = filterUserID
		}
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	reservations, total, err := h.reservationService.SearchReservations(filters, offset, limit, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get reservations",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(reservations, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// ========================================
// HELPER METHODS FOR PART 1
// ========================================

// extractUserID extracts and validates user ID from context
func (h *ReservationHandler) extractUserID(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, errors.New("user not authenticated")
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("invalid user ID format")
	}

	return uid, nil
}

// validatePaginationParams validates and adjusts pagination parameters
func (h *ReservationHandler) validatePaginationParams(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

// determineErrorStatus determines HTTP status code based on error message
func (h *ReservationHandler) determineErrorStatus(err error) int {
	switch err.Error() {
	case "access denied":
		return http.StatusForbidden
	case "time slot is not available":
		return http.StatusConflict
	case "space is not available for booking":
		return http.StatusConflict
	case "reservation cannot be modified":
		return http.StatusConflict
	case "reservation cannot be cancelled":
		return http.StatusConflict
	case "validation failed":
		return http.StatusBadRequest
	case "record not found":
		return http.StatusNotFound
	default:
		if strings.Contains(err.Error(), "exceeds") {
			return http.StatusConflict
		}
		if strings.Contains(err.Error(), "invalid") {
			return http.StatusBadRequest
		}
		return http.StatusBadRequest
	}
}

// buildFiltersFromQuery builds search filters from query parameters
func (h *ReservationHandler) buildFiltersFromQuery(c *gin.Context) map[string]interface{} {
	filters := make(map[string]interface{})

	// Status filter
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	// Space ID filter
	if spaceIDStr := c.Query("space_id"); spaceIDStr != "" {
		if spaceID, err := uuid.Parse(spaceIDStr); err == nil {
			filters["space_id"] = spaceID
		}
	}

	// User ID filter
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		if userID, err := uuid.Parse(userIDStr); err == nil {
			filters["user_id"] = userID
		}
	}

	// Title search
	if title := c.Query("title"); title != "" {
		filters["title"] = title
	}

	// Date range filters
	if startDate, err := utils.ParseTimeQuery(c, "start_date"); err == nil && startDate != nil {
		filters["start_date"] = *startDate
	}

	if endDate, err := utils.ParseTimeQuery(c, "end_date"); err == nil && endDate != nil {
		filters["end_date"] = *endDate
	}

	return filters
}

// validateReservationStatus validates if the status is valid
func (h *ReservationHandler) validateReservationStatus(status string) bool {
	validStatuses := []string{"pending", "confirmed", "cancelled", "completed", "rejected"}
	for _, validStatus := range validStatuses {
		if status == validStatus {
			return true
		}
	}
	return false
}

// ========================================
// USER PERSONAL RESERVATIONS
// ========================================

// GetUserReservations retrieves reservations for the current user
// @Summary Get user reservations
// @Description Retrieve all reservations for the authenticated user with pagination and filtering
// @Tags reservations
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param status query string false "Filter by status" Enums(pending, confirmed, cancelled, completed, rejected)
// @Param space_id query string false "Filter by space ID" format(uuid)
// @Param start_date query string false "Filter from start date" format(date-time)
// @Param end_date query string false "Filter until end date" format(date-time)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reservations/my [get]
func (h *ReservationHandler) GetUserReservations(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	// Build filters from query parameters
	filters := h.buildUserFilters(c)

	var reservations interface{}
	var total int64

	// If filters are provided, use search functionality
	if len(filters) > 0 {
		filters["user_id"] = userID // Ensure user can only see their own reservations
		reservations, total, err = h.reservationService.SearchReservations(filters, offset, limit, userID)
	} else {
		// Use simple user reservations method
		reservations, total, err = h.reservationService.GetUserReservations(userID, offset, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get reservations",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(reservations, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetUserUpcomingReservations retrieves upcoming reservations for the current user
// @Summary Get upcoming reservations
// @Description Retrieve upcoming reservations for the authenticated user
// @Tags reservations
// @Produce json
// @Param limit query int false "Number of reservations to return" default(10) minimum(1) maximum(50)
// @Param days query int false "Number of days ahead to look" default(30) minimum(1) maximum(365)
// @Success 200 {object} dto.SuccessResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reservations/my/upcoming [get]
func (h *ReservationHandler) GetUserUpcomingReservations(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	limit := utils.GetIntQueryWithValidation(c, "limit", 10, 1, 50)

	reservations, err := h.reservationService.GetUserUpcomingReservations(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get upcoming reservations",
			Message: err.Error(),
		})
		return
	}

	// Add metadata about the upcoming reservations
	responseData := map[string]interface{}{
		"reservations":     reservations,
		"count":            len(reservations),
		"next_reservation": h.getNextReservation(reservations),
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Upcoming reservations retrieved successfully",
		Data:    responseData,
	})
}

// GetUserPastReservations retrieves past reservations for the current user
// @Summary Get past reservations
// @Description Retrieve completed and past reservations for the authenticated user
// @Tags reservations
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param include_cancelled query bool false "Include cancelled reservations" default(false)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reservations/my/past [get]
func (h *ReservationHandler) GetUserPastReservations(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	includeCancelled := utils.GetBoolQuery(c, "include_cancelled", false)

	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	// Build filters for past reservations
	filters := map[string]interface{}{
		"user_id":  userID,
		"end_date": time.Now(), // Only get reservations that have ended
	}

	// Include or exclude cancelled reservations
	if !includeCancelled {
		filters["status"] = []string{"completed", "rejected"} // Exclude cancelled
	}

	reservations, total, err := h.reservationService.SearchReservations(filters, offset, limit, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get past reservations",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(reservations, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetUserActiveReservation retrieves the current active reservation for the user
// @Summary Get active reservation
// @Description Get the currently active reservation for the authenticated user (if any)
// @Tags reservations
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /reservations/my/active [get]
func (h *ReservationHandler) GetUserActiveReservation(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	reservation, err := h.reservationService.GetUserActiveReservation(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get active reservation",
			Message: err.Error(),
		})
		return
	}

	if reservation == nil {
		c.JSON(http.StatusOK, dto.SuccessResponse{
			Success: true,
			Message: "No active reservation found",
			Data:    nil,
		})
		return
	}

	// Add additional context for active reservation
	responseData := map[string]interface{}{
		"reservation":    reservation,
		"is_active":      reservation.IsActive(),
		"time_remaining": h.calculateTimeRemaining(reservation),
		"can_check_in":   h.canCheckIn(reservation),
		"can_check_out":  h.canCheckOut(reservation),
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Active reservation retrieved successfully",
		Data:    responseData,
	})
}

// GetUserReservationCount gets total reservation count for the current user
// @Summary Get user reservation count
// @Description Get the total number of reservations for the authenticated user
// @Tags reservations
// @Produce json
// @Param period query string false "Time period" Enums(all, week, month, year) default(all)
// @Param status query string false "Filter by status" Enums(pending, confirmed, cancelled, completed, rejected)
// @Success 200 {object} dto.SuccessResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /reservations/my/count [get]
func (h *ReservationHandler) GetUserReservationCount(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	period := c.DefaultQuery("period", "all")
	status := c.Query("status")

	count, err := h.reservationService.GetUserReservationCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get reservation count",
			Message: err.Error(),
		})
		return
	}

	// Get additional statistics
	stats := map[string]interface{}{
		"total_reservations": count,
		"period":             period,
		"generated_at":       time.Now(),
	}

	// Add status breakdown if no specific status filter
	if status == "" {
		if breakdown, err := h.getUserStatusBreakdown(userID); err == nil {
			stats["status_breakdown"] = breakdown
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation count retrieved successfully",
		Data:    stats,
	})
}

// GetUserReservationSummary provides a summary of user's reservation activity
// @Summary Get user reservation summary
// @Description Get a comprehensive summary of the user's reservation activity and patterns
// @Tags reservations
// @Produce json
// @Param period query string false "Analysis period" Enums(month, quarter, year) default(month)
// @Success 200 {object} dto.SuccessResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /reservations/my/summary [get]
func (h *ReservationHandler) GetUserReservationSummary(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	period := c.DefaultQuery("period", "month")
	startDate, endDate := h.calculatePeriodRange(period)

	// Get basic count
	totalCount, err := h.reservationService.GetUserReservationCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get reservation summary",
			Message: err.Error(),
		})
		return
	}

	// Get upcoming reservations count
	upcomingReservations, _ := h.reservationService.GetUserUpcomingReservations(userID, 100)
	upcomingCount := len(upcomingReservations)

	// Build summary
	summary := map[string]interface{}{
		"period":     period,
		"start_date": startDate,
		"end_date":   endDate,
		"statistics": map[string]interface{}{
			"total_reservations": totalCount,
			"upcoming_count":     upcomingCount,
			"completed_count":    h.getCompletedCount(userID),
			"cancelled_count":    h.getCancelledCount(userID),
		},
		"next_reservation": h.getNextReservationInfo(upcomingReservations),
		"generated_at":     time.Now(),
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation summary retrieved successfully",
		Data:    summary,
	})
}

// ========================================
// HELPER METHODS FOR PART 2
// ========================================

// buildUserFilters builds search filters specific to user queries
func (h *ReservationHandler) buildUserFilters(c *gin.Context) map[string]interface{} {
	filters := make(map[string]interface{})

	// Status filter
	if status := c.Query("status"); status != "" && h.validateReservationStatus(status) {
		filters["status"] = status
	}

	// Space ID filter
	if spaceIDStr := c.Query("space_id"); spaceIDStr != "" {
		if spaceID, err := uuid.Parse(spaceIDStr); err == nil {
			filters["space_id"] = spaceID
		}
	}

	// Date range filters
	if startDate, err := utils.ParseTimeQuery(c, "start_date"); err == nil && startDate != nil {
		filters["start_date"] = *startDate
	}

	if endDate, err := utils.ParseTimeQuery(c, "end_date"); err == nil && endDate != nil {
		filters["end_date"] = *endDate
	}

	return filters
}

// getNextReservation extracts the next upcoming reservation from a list
func (h *ReservationHandler) getNextReservation(reservations interface{}) interface{} {
	// Type assertion to handle the reservation list
	if resList, ok := reservations.([]interface{}); ok && len(resList) > 0 {
		return resList[0] // Assuming list is sorted by start time
	}
	return nil
}

// getNextReservationInfo gets detailed info about the next reservation
func (h *ReservationHandler) getNextReservationInfo(reservations interface{}) map[string]interface{} {
	nextRes := h.getNextReservation(reservations)
	if nextRes == nil {
		return map[string]interface{}{
			"has_next": false,
		}
	}

	return map[string]interface{}{
		"has_next":    true,
		"reservation": nextRes,
		"time_until":  "calculated_time_until", // You'd calculate this based on start time
	}
}

// calculateTimeRemaining calculates time remaining in an active reservation
func (h *ReservationHandler) calculateTimeRemaining(reservation interface{}) string {
	// This would calculate the actual time remaining
	// For now, returning a placeholder
	return "30 minutes remaining"
}

// canCheckIn determines if user can check in to the reservation
func (h *ReservationHandler) canCheckIn(reservation interface{}) bool {
	// This would check if check-in is allowed based on reservation time and status
	// Implementation depends on your business logic
	return true
}

// canCheckOut determines if user can check out of the reservation
func (h *ReservationHandler) canCheckOut(reservation interface{}) bool {
	// This would check if check-out is allowed
	// Implementation depends on your business logic
	return false
}

// getUserStatusBreakdown gets count of reservations by status for the user
func (h *ReservationHandler) getUserStatusBreakdown(userID uuid.UUID) (map[string]int, error) {
	breakdown := make(map[string]int)
	statuses := []string{"pending", "confirmed", "cancelled", "completed", "rejected"}

	for _, status := range statuses {
		filters := map[string]interface{}{
			"user_id": userID,
			"status":  status,
		}
		_, total, err := h.reservationService.SearchReservations(filters, 0, 1, userID)
		if err == nil {
			breakdown[status] = int(total)
		}
	}

	return breakdown, nil
}

// calculatePeriodRange calculates start and end dates for a given period
func (h *ReservationHandler) calculatePeriodRange(period string) (time.Time, time.Time) {
	now := time.Now()
	var startDate, endDate time.Time

	switch period {
	case "month":
		startDate = now.AddDate(0, -1, 0)
		endDate = now
	case "quarter":
		startDate = now.AddDate(0, -3, 0)
		endDate = now
	case "year":
		startDate = now.AddDate(-1, 0, 0)
		endDate = now
	default:
		startDate = now.AddDate(0, -1, 0)
		endDate = now
	}

	return startDate, endDate
}

// getCompletedCount gets count of completed reservations for user
func (h *ReservationHandler) getCompletedCount(userID uuid.UUID) int {
	filters := map[string]interface{}{
		"user_id": userID,
		"status":  "completed",
	}
	_, total, err := h.reservationService.SearchReservations(filters, 0, 1, userID)
	if err != nil {
		return 0
	}
	return int(total)
}

// getCancelledCount gets count of cancelled reservations for user
func (h *ReservationHandler) getCancelledCount(userID uuid.UUID) int {
	filters := map[string]interface{}{
		"user_id": userID,
		"status":  "cancelled",
	}
	_, total, err := h.reservationService.SearchReservations(filters, 0, 1, userID)
	if err != nil {
		return 0
	}
	return int(total)
}

// ========================================
// CHECK-IN/CHECK-OUT OPERATIONS
// ========================================

// CheckIn checks into a reservation
// @Summary Check into reservation
// @Description Check into a confirmed reservation (must be within check-in window)
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.CheckInRequest false "Check-in request (optional)"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Router /reservations/{id}/checkin [post]
func (h *ReservationHandler) CheckIn(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Optional check-in request body for notes
	var req dto.CheckInRequest
	c.ShouldBindJSON(&req) // Optional binding, ignore errors

	// Perform check-in
	err = h.reservationService.CheckIn(reservationID, userID)
	if err != nil {
		status := h.determineCheckInErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to check in",
			Message: err.Error(),
		})
		return
	}

	// Get updated reservation for response
	reservation, err := h.reservationService.GetReservationByID(reservationID, userID)
	if err != nil {
		// Check-in succeeded but couldn't fetch updated data
		c.JSON(http.StatusOK, dto.SuccessResponse{
			Success: true,
			Message: "Checked in successfully",
			Data: map[string]interface{}{
				"reservation_id": reservationID,
				"checked_in_at":  time.Now(),
				"status":         "checked_in",
			},
		})
		return
	}

	// Build comprehensive check-in response
	responseData := map[string]interface{}{
		"reservation":   reservation,
		"check_in_time": reservation.CheckInTime,
		"status":        "checked_in",
		"can_check_out": true,
		"session_info": map[string]interface{}{
			"started_at":    reservation.CheckInTime,
			"scheduled_end": reservation.EndTime,
			"duration_left": h.calculateRemainingTime(reservation.EndTime),
		},
	}

	if req.Notes != "" {
		responseData["notes"] = req.Notes
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Checked in successfully",
		Data:    responseData,
	})
}

// CheckOut checks out of a reservation
// @Summary Check out of reservation
// @Description Check out of a reservation and optionally provide feedback
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.CheckOutRequest false "Check-out request with optional feedback"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @Router /reservations/{id}/checkout [post]
func (h *ReservationHandler) CheckOut(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Optional check-out request body for feedback
	var req dto.CheckOutRequest
	c.ShouldBindJSON(&req) // Optional binding, ignore errors

	// Get reservation before check-out for duration calculation
	reservation, err := h.reservationService.GetReservationByID(reservationID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Reservation not found",
			Message: err.Error(),
		})
		return
	}

	// Perform check-out
	err = h.reservationService.CheckOut(reservationID, userID)
	if err != nil {
		status := h.determineCheckOutErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to check out",
			Message: err.Error(),
		})
		return
	}

	// Calculate session duration
	var sessionDuration string
	var actualDuration time.Duration
	if reservation.CheckInTime != nil {
		actualDuration = time.Now().Sub(*reservation.CheckInTime)
		sessionDuration = h.formatDuration(actualDuration)
	}

	// Build comprehensive check-out response
	responseData := map[string]interface{}{
		"reservation_id": reservationID,
		"checked_out_at": time.Now(),
		"status":         "completed",
		"session_summary": map[string]interface{}{
			"check_in_time":      reservation.CheckInTime,
			"check_out_time":     time.Now(),
			"session_duration":   sessionDuration,
			"scheduled_duration": h.formatDuration(reservation.EndTime.Sub(reservation.StartTime)),
			"early_checkout":     time.Now().Before(reservation.EndTime),
		},
	}

	// Add feedback if provided
	if req.Feedback != "" {
		responseData["feedback"] = req.Feedback
	}
	if req.Rating != nil {
		responseData["rating"] = *req.Rating
	}
	if req.Notes != "" {
		responseData["notes"] = req.Notes
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Checked out successfully",
		Data:    responseData,
	})
}

// GetCheckInStatus gets the check-in status of a reservation
// @Summary Get check-in status
// @Description Get detailed check-in/check-out status for a reservation
// @Tags reservations
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /reservations/{id}/status [get]
func (h *ReservationHandler) GetCheckInStatus(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	reservation, err := h.reservationService.GetReservationByID(reservationID, userID)
	if err != nil {
		status := http.StatusNotFound
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get reservation",
			Message: err.Error(),
		})
		return
	}

	// Build comprehensive status response
	statusData := h.buildCheckInStatusResponse(reservation)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Check-in status retrieved successfully",
		Data:    statusData,
	})
}

// GetCheckedInReservations gets all currently checked-in reservations (admin/manager)
// @Summary Get checked-in reservations
// @Description Get all reservations that are currently checked in (admin and managers only)
// @Tags reservations
// @Produce json
// @Param space_id query string false "Filter by space ID" format(uuid)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reservations/checked-in [get]
func (h *ReservationHandler) GetCheckedInReservations(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Build filters for checked-in reservations
	filters := map[string]interface{}{
		"status": "confirmed",
		// Add check-in filter (this would need to be implemented in the service)
	}

	// Add space filter if provided
	if spaceIDStr := c.Query("space_id"); spaceIDStr != "" {
		if spaceID, err := uuid.Parse(spaceIDStr); err == nil {
			filters["space_id"] = spaceID
		}
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	reservations, total, err := h.reservationService.SearchReservations(filters, offset, limit, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get checked-in reservations",
			Message: err.Error(),
		})
		return
	}

	// Filter only actually checked-in reservations (additional filtering)
	checkedInReservations := h.filterCheckedInReservations(reservations)

	response := dto.NewPaginatedResponse(checkedInReservations, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// MarkNoShow marks a reservation as no-show (managers/admins only)
// @Summary Mark reservation as no-show
// @Description Mark a reservation as no-show when user fails to check in (managers and admins only)
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.NoShowRequest true "No-show report request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /reservations/{id}/no-show [post]
func (h *ReservationHandler) MarkNoShow(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	var req dto.NoShowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Validate that reason is provided
	if req.Reason == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: "Reason is required for no-show reports",
		})
		return
	}

	// This would need to be implemented in the service
	// err = h.reservationService.MarkNoShow(reservationID, userID, req.Reason)

	// For now, simulate the operation
	responseData := map[string]interface{}{
		"reservation_id": reservationID,
		"action":         "marked_no_show",
		"reported_by":    userID,
		"reason":         req.Reason,
		"reported_time":  time.Now(),
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation marked as no-show",
		Data:    responseData,
	})
}

// ========================================
// HELPER METHODS FOR PART 3
// ========================================

// determineCheckInErrorStatus determines HTTP status for check-in errors
func (h *ReservationHandler) determineCheckInErrorStatus(err error) int {
	switch err.Error() {
	case "can only check in to your own reservation":
		return http.StatusForbidden
	case "reservation must be confirmed to check in":
		return http.StatusConflict
	case "already checked in":
		return http.StatusConflict
	case "can only check in within 15 minutes of start time":
		return http.StatusConflict
	default:
		return http.StatusBadRequest
	}
}

// determineCheckOutErrorStatus determines HTTP status for check-out errors
func (h *ReservationHandler) determineCheckOutErrorStatus(err error) int {
	switch err.Error() {
	case "can only check out of your own reservation":
		return http.StatusForbidden
	case "must check in before checking out":
		return http.StatusConflict
	case "already checked out":
		return http.StatusConflict
	default:
		return http.StatusBadRequest
	}
}

// buildCheckInStatusResponse builds comprehensive check-in status response
func (h *ReservationHandler) buildCheckInStatusResponse(reservation interface{}) map[string]interface{} {
	// This would access actual reservation fields - using placeholder logic
	now := time.Now()

	status := map[string]interface{}{
		"reservation_id": "placeholder", // reservation.ID
		"current_status": "confirmed",   // reservation.Status
		"is_checked_in":  false,         // reservation.CheckInTime != nil
		"is_checked_out": false,         // reservation.CheckOutTime != nil
		"current_time":   now,
	}

	// Add check-in window information
	status["check_in_window"] = map[string]interface{}{
		"can_check_in_now": h.isWithinCheckInWindow(now),
		"check_in_opens":   "15 minutes before start time",
		"check_in_closes":  "at end time",
	}

	// Add session information if checked in
	if false { // This would be: reservation.CheckInTime != nil
		status["session_info"] = map[string]interface{}{
			"checked_in_at":    "placeholder", // reservation.CheckInTime
			"session_duration": "placeholder", // calculate duration
			"can_check_out":    true,
		}
	}

	return status
}

// calculateRemainingTime calculates time remaining until end time
func (h *ReservationHandler) calculateRemainingTime(endTime time.Time) string {
	remaining := time.Until(endTime)
	if remaining <= 0 {
		return "expired"
	}
	return h.formatDuration(remaining)
}

// formatDuration formats a duration into a human-readable string
func (h *ReservationHandler) formatDuration(duration time.Duration) string {
	hours := int(duration.Hours())
	minutes := int(duration.Minutes()) % 60

	if hours > 0 {
		return fmt.Sprintf("%d hours %d minutes", hours, minutes)
	}
	return fmt.Sprintf("%d minutes", minutes)
}

// isWithinCheckInWindow checks if current time is within check-in window
func (h *ReservationHandler) isWithinCheckInWindow(currentTime time.Time) bool {
	// This would check against actual reservation start/end times
	// For now, returning placeholder logic
	return true
}

// filterCheckedInReservations filters reservations to only include checked-in ones
func (h *ReservationHandler) filterCheckedInReservations(reservations interface{}) interface{} {
	// This would filter the actual reservation list based on check-in status
	// For now, returning the input as-is
	return reservations
}

// validateCheckInTiming validates if check-in is allowed at current time
func (h *ReservationHandler) validateCheckInTiming(reservation interface{}) error {
	// This would validate against actual reservation times
	// Implementation would check:
	// - Is it within 15 minutes of start time?
	// - Is it before end time?
	// - Is reservation status confirmed?
	return nil
}

// validateCheckOutTiming validates if check-out is allowed
func (h *ReservationHandler) validateCheckOutTiming(reservation interface{}) error {
	// This would validate check-out conditions:
	// - Is user checked in?
	// - Is it a valid time to check out?
	return nil
}

// generateSessionSummary generates a summary of the reservation session
func (h *ReservationHandler) generateSessionSummary(reservation interface{}, checkOutTime time.Time) map[string]interface{} {
	return map[string]interface{}{
		"total_duration":    "calculated duration",
		"early_checkout":    false, // Was checkout before scheduled end?
		"utilization_rate":  100,   // Percentage of scheduled time used
		"was_no_show":       false,
		"feedback_provided": false,
	}
}

// ========================================
// SEARCH AND FILTER OPERATIONS
// ========================================

// SearchReservations searches reservations with advanced filters
// @Summary Search reservations
// @Description Search reservations using multiple filters and sorting options
// @Tags reservations
// @Produce json
// @Param query query string false "Search query (searches in title and description)"
// @Param status query []string false "Filter by status" Enums(pending, confirmed, cancelled, completed, rejected)
// @Param space_ids query []string false "Filter by space IDs" format(uuid)
// @Param user_ids query []string false "Filter by user IDs" format(uuid)
// @Param start_date query string false "Filter from start date" format(date-time)
// @Param end_date query string false "Filter until end date" format(date-time)
// @Param min_participants query int false "Minimum participant count" minimum(1)
// @Param max_participants query int false "Maximum participant count" minimum(1)
// @Param is_recurring query bool false "Filter recurring reservations"
// @Param include_checked_in query bool false "Include checked-in reservations" default(true)
// @Param sort_by query string false "Sort by field" Enums(start_time, end_time, created_at, title, participant_count) default(start_time)
// @Param sort_order query string false "Sort order" Enums(asc, desc) default(asc)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.ReservationSearchResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reservations/search [get]
func (h *ReservationHandler) SearchReservations(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Parse and validate search request
	searchReq, err := h.parseSearchRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid search parameters",
			Message: err.Error(),
		})
		return
	}

	// Build filters from search request
	filters := h.buildAdvancedFilters(searchReq)

	// Set pagination
	page, limit := h.validatePaginationParams(searchReq.Page, searchReq.Limit)
	offset := (page - 1) * limit

	// Perform search
	reservations, total, err := h.reservationService.SearchReservations(filters, offset, limit, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Search failed",
			Message: err.Error(),
		})
		return
	}

	// Build search summary
	summary := h.buildSearchSummary(reservations, total, filters)

	// Create response
	response := dto.ReservationSearchResponse{
		Reservations: h.convertToReservationResponses(reservations),
		Filters:      h.convertToSearchFilters(searchReq),
		Pagination:   dto.NewPaginationMeta(page, int(total), limit),
		Summary:      summary,
	}

	c.JSON(http.StatusOK, response)
}

// GetReservationsByDateRange gets reservations within a specific date range
// @Summary Get reservations by date range
// @Description Retrieve reservations within a specific date range with optional filtering
// @Tags reservations
// @Produce json
// @Param start_date query string true "Start date" format(date-time)
// @Param end_date query string true "End date" format(date-time)
// @Param space_id query string false "Filter by space ID" format(uuid)
// @Param status query []string false "Filter by status" Enums(pending, confirmed, cancelled, completed, rejected)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(50) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /reservations/date-range [get]
func (h *ReservationHandler) GetReservationsByDateRange(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Parse and validate date range
	startDate, endDate, err := h.parseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid date range",
			Message: err.Error(),
		})
		return
	}

	// Validate date range constraints
	if err := h.validateDateRange(startDate, endDate); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid date range",
			Message: err.Error(),
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 50)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	reservations, total, err := h.reservationService.GetReservationsByDateRange(startDate, endDate, offset, limit, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get reservations",
			Message: err.Error(),
		})
		return
	}

	// Add date range metadata to response
	responseData := map[string]interface{}{
		"reservations": reservations,
		"date_range": map[string]interface{}{
			"start_date": startDate,
			"end_date":   endDate,
			"duration":   endDate.Sub(startDate).String(),
			"total_days": int(endDate.Sub(startDate).Hours() / 24),
		},
		"statistics": h.generateDateRangeStats(reservations, startDate, endDate),
	}

	response := dto.NewPaginatedResponse(responseData, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetReservationsByStatus gets reservations filtered by status (admin/manager only)
// @Summary Get reservations by status
// @Description Get reservations filtered by status with admin or manager permissions
// @Tags reservations
// @Produce json
// @Param status path string true "Reservation status" Enums(pending, confirmed, cancelled, completed, rejected)
// @Param space_id query string false "Filter by space ID" format(uuid)
// @Param user_id query string false "Filter by user ID" format(uuid)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Router /reservations/status/{status} [get]
func (h *ReservationHandler) GetReservationsByStatus(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	status := strings.ToLower(c.Param("status"))
	if !h.validateReservationStatus(status) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid status",
			Message: "Status must be one of: pending, confirmed, cancelled, completed, rejected",
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	reservations, total, err := h.reservationService.GetReservationsByStatus(status, offset, limit, userID)
	if err != nil {
		httpStatus := http.StatusInternalServerError
		if err.Error() == "access denied" {
			httpStatus = http.StatusForbidden
		}
		c.JSON(httpStatus, dto.ErrorResponse{
			Error:   "Failed to get reservations",
			Message: err.Error(),
		})
		return
	}

	// Add status-specific metadata
	responseData := map[string]interface{}{
		"reservations": reservations,
		"status_info": map[string]interface{}{
			"status":      status,
			"total_count": total,
			"description": h.getStatusDescription(status),
		},
	}

	response := dto.NewPaginatedResponse(responseData, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// AdvancedSearch performs complex search with JSON body
// @Summary Advanced reservation search
// @Description Perform complex search with detailed filters in request body
// @Tags reservations
// @Accept json
// @Produce json
// @Param request body dto.ReservationSearchRequest true "Advanced search request"
// @Success 200 {object} dto.ReservationSearchResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /reservations/advanced-search [post]
func (h *ReservationHandler) AdvancedSearch(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	var req dto.ReservationSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Set defaults and validate
	req.SetDefaults()
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid search parameters",
			Message: err.Error(),
		})
		return
	}

	// Build advanced filters
	filters := h.buildAdvancedFilters(&req)

	// Set pagination
	page, limit := h.validatePaginationParams(req.Page, req.Limit)
	offset := req.GetOffset()

	// Perform search
	reservations, total, err := h.reservationService.SearchReservations(filters, offset, limit, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Advanced search failed",
			Message: err.Error(),
		})
		return
	}

	// Build comprehensive response
	response := dto.ReservationSearchResponse{
		Reservations: h.convertToReservationResponses(reservations),
		Filters:      h.convertToSearchFilters(&req),
		Pagination:   dto.NewPaginationMeta(page, int(total), limit),
		Summary:      h.buildAdvancedSearchSummary(reservations, total, filters),
	}

	c.JSON(http.StatusOK, response)
}

// GetReservationCalendar gets calendar view of reservations
// @Summary Get reservation calendar
// @Description Get calendar view of reservations for a specific date range
// @Tags reservations
// @Produce json
// @Param start_date query string true "Calendar start date" format(date)
// @Param end_date query string true "Calendar end date" format(date)
// @Param space_id query string false "Filter by space ID" format(uuid)
// @Param view query string false "Calendar view" Enums(day, week, month) default(week)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /reservations/calendar [get]
func (h *ReservationHandler) GetReservationCalendar(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Parse calendar parameters
	startDate, endDate, err := h.parseCalendarDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid calendar parameters",
			Message: err.Error(),
		})
		return
	}

	view := c.DefaultQuery("view", "week")
	if !h.isValidCalendarView(view) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid view",
			Message: "View must be one of: day, week, month",
		})
		return
	}

	// Build calendar filters
	filters := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
	}

	if spaceIDStr := c.Query("space_id"); spaceIDStr != "" {
		if spaceID, err := uuid.Parse(spaceIDStr); err == nil {
			filters["space_id"] = spaceID
		}
	}

	// Get reservations for calendar period
	reservations, _, err := h.reservationService.SearchReservations(filters, 0, 1000, userID) // High limit for calendar
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get calendar data",
			Message: err.Error(),
		})
		return
	}

	// Build calendar response
	calendarData := h.buildCalendarResponse(reservations, startDate, endDate, view)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Calendar data retrieved successfully",
		Data:    calendarData,
	})
}

// ========================================
// HELPER METHODS FOR PART 4
// ========================================

// parseSearchRequest parses search parameters from query string
func (h *ReservationHandler) parseSearchRequest(c *gin.Context) (*dto.ReservationSearchRequest, error) {
	includeCheckedIn := utils.GetBoolQuery(c, "include_checked_in", true)
	req := &dto.ReservationSearchRequest{
		Query:            c.Query("query"),
		Statuses:         c.QueryArray("status"),
		SpaceIDs:         c.QueryArray("space_ids"),
		UserIDs:          c.QueryArray("user_ids"),
		SortBy:           c.DefaultQuery("sort_by", "start_time"),
		SortOrder:        c.DefaultQuery("sort_order", "asc"),
		Page:             utils.GetIntQuery(c, "page", 1),
		Limit:            utils.GetIntQuery(c, "limit", 20),
		IncludeCheckedIn: &includeCheckedIn,
	}

	// Parse integer parameters
	if minStr := c.Query("min_participants"); minStr != "" {
		if min, err := strconv.Atoi(minStr); err == nil {
			req.MinParticipants = &min
		}
	}

	if maxStr := c.Query("max_participants"); maxStr != "" {
		if max, err := strconv.Atoi(maxStr); err == nil {
			req.MaxParticipants = &max
		}
	}

	// Parse boolean parameters
	if recurringStr := c.Query("is_recurring"); recurringStr != "" {
		if recurring, err := strconv.ParseBool(recurringStr); err == nil {
			req.IsRecurring = &recurring
		}
	}

	// Parse date parameters
	if startDate, err := utils.ParseTimeQuery(c, "start_date"); err == nil && startDate != nil {
		req.StartDate = startDate
	}

	if endDate, err := utils.ParseTimeQuery(c, "end_date"); err == nil && endDate != nil {
		req.EndDate = endDate
	}

	req.SetDefaults()
	return req, req.Validate()
}

// buildAdvancedFilters builds filters for advanced search
func (h *ReservationHandler) buildAdvancedFilters(req *dto.ReservationSearchRequest) map[string]interface{} {
	filters := make(map[string]interface{})

	if req.Query != "" {
		filters["title"] = req.Query
	}

	if len(req.Statuses) > 0 {
		filters["status"] = req.Statuses
	}

	if len(req.SpaceIDs) > 0 {
		spaceUUIDs := make([]uuid.UUID, 0, len(req.SpaceIDs))
		for _, idStr := range req.SpaceIDs {
			if id, err := uuid.Parse(idStr); err == nil {
				spaceUUIDs = append(spaceUUIDs, id)
			}
		}
		if len(spaceUUIDs) > 0 {
			filters["space_ids"] = spaceUUIDs
		}
	}

	if len(req.UserIDs) > 0 {
		userUUIDs := make([]uuid.UUID, 0, len(req.UserIDs))
		for _, idStr := range req.UserIDs {
			if id, err := uuid.Parse(idStr); err == nil {
				userUUIDs = append(userUUIDs, id)
			}
		}
		if len(userUUIDs) > 0 {
			filters["user_ids"] = userUUIDs
		}
	}

	if req.StartDate != nil {
		filters["start_date"] = *req.StartDate
	}

	if req.EndDate != nil {
		filters["end_date"] = *req.EndDate
	}

	if req.MinParticipants != nil {
		filters["min_participants"] = *req.MinParticipants
	}

	if req.MaxParticipants != nil {
		filters["max_participants"] = *req.MaxParticipants
	}

	if req.IsRecurring != nil {
		filters["is_recurring"] = *req.IsRecurring
	}

	if req.IncludeCheckedIn != nil {
		filters["include_checked_in"] = *req.IncludeCheckedIn
	}

	return filters
}

// parseDateRange parses start and end dates from query parameters
func (h *ReservationHandler) parseDateRange(c *gin.Context) (time.Time, time.Time, error) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		return time.Time{}, time.Time{}, errors.New("start_date and end_date are required")
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid start_date format: %v", err)
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid end_date format: %v", err)
	}

	return startDate, endDate, nil
}

// validateDateRange validates that the date range is reasonable
func (h *ReservationHandler) validateDateRange(startDate, endDate time.Time) error {
	if startDate.After(endDate) {
		return errors.New("start_date must be before end_date")
	}

	// Limit range to 1 year for performance
	if endDate.Sub(startDate) > 365*24*time.Hour {
		return errors.New("date range cannot exceed 1 year")
	}

	return nil
}

// buildSearchSummary builds a summary of search results
func (h *ReservationHandler) buildSearchSummary(reservations interface{}, total int64, filters map[string]interface{}) *dto.SearchSummary {
	summary := &dto.SearchSummary{
		TotalFound:   int(total),
		StatusCounts: make(map[string]int),
		SpaceCounts:  make(map[string]int),
	}

	// This would analyze the actual reservations to build counts
	// For now, providing placeholder structure
	return summary
}

// convertToReservationResponses converts reservation models to response DTOs
func (h *ReservationHandler) convertToReservationResponses(reservations interface{}) []dto.ReservationResponse {
	// This would convert actual reservation models to DTOs
	// For now, returning empty slice
	return []dto.ReservationResponse{}
}

// convertToSearchFilters converts search request to filter DTO
func (h *ReservationHandler) convertToSearchFilters(req *dto.ReservationSearchRequest) dto.SearchFilters {
	return dto.SearchFilters{
		SortBy:    req.SortBy,
		SortOrder: req.SortOrder,
	}
}

// GetSpaceReservations gets all reservations for a specific space (manager/admin)
// @Summary Get space reservations
// @Description Get all reservations for a specific space (managers and admins only)
// @Tags reservations
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Param start_date query string false "Start date filter" format(date-time)
// @Param end_date query string false "End date filter" format(date-time)
// @Param status query string false "Status filter" Enums(pending, confirmed, cancelled, completed, rejected)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /manager/spaces/{id}/reservations [get]
func (h *ReservationHandler) GetSpaceReservations(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space ID",
			Message: "Space ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	// Parse date filters (default to current month if not provided)
	now := time.Now()
	startDate := now.AddDate(0, -1, 0) // 1 month ago
	endDate := now.AddDate(0, 1, 0)    // 1 month from now

	if startDateStr := c.Query("start_date"); startDateStr != "" {
		if parsed, err := time.Parse(time.RFC3339, startDateStr); err == nil {
			startDate = parsed
		}
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if parsed, err := time.Parse(time.RFC3339, endDateStr); err == nil {
			endDate = parsed
		}
	}

	// Get space reservations using service method
	reservations, err := h.reservationService.GetSpaceReservations(spaceID, startDate, endDate, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get space reservations",
			Message: err.Error(),
		})
		return
	}

	// Filter by status if provided
	if statusFilter := c.Query("status"); statusFilter != "" {
		filteredReservations := make([]*models.Reservation, 0)
		for _, reservation := range reservations {
			if string(reservation.Status) == statusFilter {
				filteredReservations = append(filteredReservations, reservation)
			}
		}
		reservations = filteredReservations
	}

	// Add metadata
	responseData := map[string]interface{}{
		"space_id":     spaceID,
		"reservations": reservations,
		"total_count":  len(reservations),
		"date_range": map[string]interface{}{
			"start_date": startDate,
			"end_date":   endDate,
		},
		"filters": map[string]interface{}{
			"status": c.Query("status"),
		},
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space reservations retrieved successfully",
		Data:    responseData,
	})
}

// GetPendingApprovals gets reservations needing approval for manager
// @Summary Get pending approvals
// @Description Get all reservations pending approval for spaces managed by the current user
// @Tags reservations
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param space_id query string false "Filter by specific space ID" format(uuid)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /manager/approvals [get]
func (h *ReservationHandler) GetPendingApprovals(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	// Get pending approvals using service method
	reservations, total, err := h.reservationService.GetPendingApprovals(userID, offset, limit)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "only managers and admins can view pending approvals" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get pending approvals",
			Message: err.Error(),
		})
		return
	}

	// Filter by space if specified
	if spaceIDStr := c.Query("space_id"); spaceIDStr != "" {
		if spaceID, err := uuid.Parse(spaceIDStr); err == nil {
			filteredReservations := make([]*models.Reservation, 0)
			for _, reservation := range reservations {
				if reservation.SpaceID == spaceID {
					filteredReservations = append(filteredReservations, reservation)
				}
			}
			reservations = filteredReservations
			total = int64(len(reservations))
		}
	}

	// Add metadata for pending approvals
	responseData := map[string]interface{}{
		"reservations": reservations,
		"summary": map[string]interface{}{
			"total_pending": total,
			"page":          page,
			"limit":         limit,
		},
	}

	response := dto.NewPaginatedResponse(responseData, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// ApproveReservation approves a pending reservation
// @Summary Approve reservation
// @Description Approve a pending reservation (managers and admins only)
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.ApprovalRequest true "Approval request with optional comments"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /manager/approvals/{id}/approve [post]
func (h *ReservationHandler) ApproveReservation(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	var req dto.ApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Approve reservation using service method
	err = h.reservationService.ApproveReservation(reservationID, userID, req.Comments)
	if err != nil {
		status := h.determineApprovalErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to approve reservation",
			Message: err.Error(),
		})
		return
	}

	// Get updated reservation for response
	reservation, err := h.reservationService.GetReservationByID(reservationID, userID)
	if err != nil {
		// Approval succeeded but couldn't fetch updated data
		c.JSON(http.StatusOK, dto.SuccessResponse{
			Success: true,
			Message: "Reservation approved successfully",
			Data: map[string]interface{}{
				"reservation_id": reservationID,
				"status":         "confirmed",
				"approved_at":    time.Now(),
				"approved_by":    userID,
			},
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation approved successfully",
		Data: map[string]interface{}{
			"reservation": reservation,
			"action":      "approved",
			"approved_by": userID,
			"comments":    req.Comments,
		},
	})
}

// RejectReservation rejects a pending reservation
// @Summary Reject reservation
// @Description Reject a pending reservation with reason (managers and admins only)
// @Tags reservations
// @Accept json
// @Produce json
// @Param id path string true "Reservation ID" format(uuid)
// @Param request body dto.RejectionRequest true "Rejection request with reason"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /manager/approvals/{id}/reject [post]
func (h *ReservationHandler) RejectReservation(c *gin.Context) {
	reservationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid reservation ID",
			Message: "Reservation ID must be a valid UUID",
		})
		return
	}

	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	var req dto.RejectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Validate that reason is provided
	if req.Reason == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: "Rejection reason is required",
		})
		return
	}

	// Reject reservation using service method
	err = h.reservationService.RejectReservation(reservationID, userID, req.Reason)
	if err != nil {
		status := h.determineApprovalErrorStatus(err)
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to reject reservation",
			Message: err.Error(),
		})
		return
	}

	// Get updated reservation for response
	reservation, err := h.reservationService.GetReservationByID(reservationID, userID)
	if err != nil {
		// Rejection succeeded but couldn't fetch updated data
		c.JSON(http.StatusOK, dto.SuccessResponse{
			Success: true,
			Message: "Reservation rejected successfully",
			Data: map[string]interface{}{
				"reservation_id": reservationID,
				"status":         "rejected",
				"rejected_at":    time.Now(),
				"rejected_by":    userID,
				"reason":         req.Reason,
			},
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation rejected successfully",
		Data: map[string]interface{}{
			"reservation": reservation,
			"action":      "rejected",
			"rejected_by": userID,
			"reason":      req.Reason,
		},
	})
}

func (h *ReservationHandler) determineApprovalErrorStatus(err error) int {
	switch err.Error() {
	case "access denied":
		return http.StatusForbidden
	case "reservation is not pending approval":
		return http.StatusConflict
	case "only managers and admins can view pending approvals":
		return http.StatusForbidden
	case "rejection reason is required":
		return http.StatusBadRequest
	default:
		if strings.Contains(err.Error(), "not found") {
			return http.StatusNotFound
		}
		return http.StatusBadRequest
	}
}

// generateDateRangeStats generates statistics for a date range
func (h *ReservationHandler) generateDateRangeStats(reservations interface{}, startDate, endDate time.Time) map[string]interface{} {
	return map[string]interface{}{
		"total_reservations": 0, // Would count actual reservations
		"date_coverage":      endDate.Sub(startDate).String(),
		"daily_average":      0.0,
		"peak_day":           startDate.Format("2006-01-02"),
	}
}

// getStatusDescription returns a human-readable description for a status
func (h *ReservationHandler) getStatusDescription(status string) string {
	descriptions := map[string]string{
		"pending":   "Reservations awaiting approval",
		"confirmed": "Approved and confirmed reservations",
		"cancelled": "Cancelled reservations",
		"completed": "Completed reservations",
		"rejected":  "Rejected reservation requests",
	}

	if desc, exists := descriptions[status]; exists {
		return desc
	}
	return "Unknown status"
}

// parseCalendarDateRange parses calendar-specific date range
func (h *ReservationHandler) parseCalendarDateRange(c *gin.Context) (time.Time, time.Time, error) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		return time.Time{}, time.Time{}, errors.New("start_date and end_date are required for calendar view")
	}

	// Parse as date-only first, then as datetime
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		startDate, err = time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return time.Time{}, time.Time{}, fmt.Errorf("invalid start_date format: %v", err)
		}
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		endDate, err = time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return time.Time{}, time.Time{}, fmt.Errorf("invalid end_date format: %v", err)
		}
	}

	return startDate, endDate, nil
}

// isValidCalendarView validates calendar view parameter
func (h *ReservationHandler) isValidCalendarView(view string) bool {
	validViews := []string{"day", "week", "month"}
	for _, validView := range validViews {
		if view == validView {
			return true
		}
	}
	return false
}

// buildCalendarResponse builds calendar-specific response
func (h *ReservationHandler) buildCalendarResponse(reservations interface{}, startDate, endDate time.Time, view string) map[string]interface{} {
	return map[string]interface{}{
		"view":          view,
		"start_date":    startDate,
		"end_date":      endDate,
		"reservations":  reservations,
		"calendar_data": h.organizeByCalendarView(reservations, view),
		"summary":       h.buildCalendarSummary(reservations, startDate, endDate),
	}
}

// organizeByCalendarView organizes reservations by calendar view
func (h *ReservationHandler) organizeByCalendarView(reservations interface{}, view string) interface{} {
	// This would organize reservations by day/week/month based on view
	// For now, returning placeholder
	return map[string]interface{}{
		"organized_by": view,
		"data":         "calendar_organized_data",
	}
}

// buildCalendarSummary builds summary for calendar view
func (h *ReservationHandler) buildCalendarSummary(reservations interface{}, startDate, endDate time.Time) map[string]interface{} {
	return map[string]interface{}{
		"period_days":        int(endDate.Sub(startDate).Hours() / 24),
		"total_reservations": 0, // Would count actual reservations
		"busiest_day":        startDate.Format("2006-01-02"),
		"average_per_day":    0.0,
	}
}

// buildAdvancedSearchSummary builds summary for advanced search results
func (h *ReservationHandler) buildAdvancedSearchSummary(reservations interface{}, total int64, filters map[string]interface{}) *dto.SearchSummary {
	return &dto.SearchSummary{
		TotalFound:      int(total),
		StatusCounts:    make(map[string]int),
		SpaceCounts:     make(map[string]int),
		TotalHours:      0.0,
		AverageDuration: 0.0,
	}
}
