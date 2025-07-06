// internal/handlers/space_handler.go
package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/repositories/interfaces"
	"room-reservation-api/internal/services"
	"room-reservation-api/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SpaceHandler handles space-related HTTP requests
type SpaceHandler struct {
	spaceService *services.SpaceService
}

// NewSpaceHandler creates a new space handler
func NewSpaceHandler(spaceService *services.SpaceService) *SpaceHandler {
	return &SpaceHandler{
		spaceService: spaceService,
	}
}

// ========================================
// BASIC CRUD OPERATIONS
// ========================================

// CreateSpace creates a new space
// @Summary Create a new space
// @Description Create a new space with the provided details
// @Tags spaces
// @Accept json
// @Produce json
// @Param request body dto.CreateSpaceRequest true "Create space request"
// @Success 201 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Router /spaces [post]
func (h *SpaceHandler) CreateSpace(c *gin.Context) {
	var req dto.CreateSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	space, err := h.spaceService.CreateSpace(&req, userID.(uuid.UUID))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "only admins and managers can create spaces" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to create space",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Message: "Space created successfully",
		Data:    space,
	})
}

// GetSpace retrieves a space by ID
// @Summary Get space by ID
// @Description Retrieve detailed information about a specific space
// @Tags spaces
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id} [get]
func (h *SpaceHandler) GetSpace(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space ID",
			Message: "Space ID must be a valid UUID",
		})
		return
	}

	space, err := h.spaceService.GetSpaceByID(spaceID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Space not found",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    space,
	})
}

// UpdateSpace updates an existing space
// @Summary Update space
// @Description Update space details (only managers and admins)
// @Tags spaces
// @Accept json
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Param request body dto.UpdateSpaceRequest true "Update space request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id} [put]
func (h *SpaceHandler) UpdateSpace(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space ID",
			Message: "Space ID must be a valid UUID",
		})
		return
	}

	var req dto.UpdateSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	space, err := h.spaceService.UpdateSpace(spaceID, &req, userID.(uuid.UUID))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to update space",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space updated successfully",
		Data:    space,
	})
}

// DeleteSpace deletes a space (admin only)
// @Summary Delete space
// @Description Delete a space (admin only, cannot delete spaces with active reservations)
// @Tags spaces
// @Param id path string true "Space ID" format(uuid)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id} [delete]
func (h *SpaceHandler) DeleteSpace(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space ID",
			Message: "Space ID must be a valid UUID",
		})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	err = h.spaceService.DeleteSpace(spaceID, userID.(uuid.UUID))
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "only administrators can delete spaces" {
			status = http.StatusForbidden
		}
		if err.Error() == "cannot delete space with active reservations" {
			status = http.StatusConflict
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to delete space",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space deleted successfully",
	})
}

// GetSpaces retrieves all spaces with pagination
// @Summary Get all spaces
// @Description Retrieve a paginated list of all spaces
// @Tags spaces
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces [get]
func (h *SpaceHandler) GetSpaces(c *gin.Context) {
	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetAllSpaces(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// ========================================
// HELPER METHODS FOR PART 1
// ========================================

// validatePaginationParams validates and sets default pagination parameters
func (h *SpaceHandler) validatePaginationParams(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

// handleSpaceError handles common space-related errors and returns appropriate HTTP status
func (h *SpaceHandler) handleSpaceError(err error) (int, dto.ErrorResponse) {
	switch err.Error() {
	case "access denied":
		return http.StatusForbidden, dto.ErrorResponse{
			Error:   "Access denied",
			Message: "You don't have permission to perform this action",
		}
	case "only administrators can delete spaces":
		return http.StatusForbidden, dto.ErrorResponse{
			Error:   "Access denied",
			Message: "Only administrators can delete spaces",
		}
	case "only admins and managers can create spaces":
		return http.StatusForbidden, dto.ErrorResponse{
			Error:   "Access denied",
			Message: "Only administrators and managers can create spaces",
		}
	case "cannot delete space with active reservations":
		return http.StatusConflict, dto.ErrorResponse{
			Error:   "Conflict",
			Message: "Cannot delete space with active reservations",
		}
	case "space with this name already exists in the building":
		return http.StatusConflict, dto.ErrorResponse{
			Error:   "Conflict",
			Message: "A space with this name already exists in the building",
		}
	default:
		if err.Error() == "record not found" {
			return http.StatusNotFound, dto.ErrorResponse{
				Error:   "Not found",
				Message: "Space not found",
			}
		}
		return http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Bad request",
			Message: err.Error(),
		}
	}
}

// extractUserID extracts and validates user ID from context
func (h *SpaceHandler) extractUserID(c *gin.Context) (uuid.UUID, error) {
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

// ========================================
// SEARCH AND FILTER OPERATIONS
// ========================================

// SearchSpaces searches spaces with multiple filters
// @Summary Search spaces
// @Description Search spaces using various filters like type, building, capacity, etc.
// @Tags spaces
// @Produce json
// @Param query query string false "Search query (searches in name and description)"
// @Param types query []string false "Space types" Enums(meeting_room, office, auditorium, open_space, hot_desk, conference_room)
// @Param buildings query []string false "Buildings to filter by"
// @Param floors query []int false "Floor numbers to filter by"
// @Param min_capacity query int false "Minimum capacity" minimum(1)
// @Param max_capacity query int false "Maximum capacity" minimum(1)
// @Param status query []string false "Space status" Enums(available, maintenance, out_of_service, reserved)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param sort_by query string false "Sort by field" Enums(name, capacity, building, floor, type, created_at) default(name)
// @Param sort_order query string false "Sort order" Enums(asc, desc) default(asc)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/search [get]
func (h *SpaceHandler) SearchSpaces(c *gin.Context) {
	var req dto.SpaceSearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid query parameters",
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

	// Validate and adjust pagination
	req.Page, req.Limit = h.validatePaginationParams(req.Page, req.Limit)
	offset := req.GetOffset()

	// Convert to repository filters
	filters := h.convertToSpaceFilters(&req)

	spaces, total, err := h.spaceService.SearchSpaces(filters, offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to search spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, req.Page, req.Limit)
	c.JSON(http.StatusOK, response)
}

// GetSpacesByBuilding retrieves spaces in a specific building
// @Summary Get spaces by building
// @Description Retrieve all spaces in a specific building with pagination
// @Tags spaces
// @Produce json
// @Param building path string true "Building name"
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param sort_by query string false "Sort by field" Enums(name, capacity, floor, room_number) default(floor)
// @Param sort_order query string false "Sort order" Enums(asc, desc) default(asc)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/building/{building} [get]
func (h *SpaceHandler) GetSpacesByBuilding(c *gin.Context) {
	building := strings.TrimSpace(c.Param("building"))
	if building == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid building name",
			Message: "Building name cannot be empty",
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetSpacesByBuilding(building, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetSpacesByType retrieves spaces of a specific type
// @Summary Get spaces by type
// @Description Retrieve all spaces of a specific type with pagination
// @Tags spaces
// @Produce json
// @Param type path string true "Space type" Enums(meeting_room, office, auditorium, open_space, hot_desk, conference_room)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/type/{type} [get]
func (h *SpaceHandler) GetSpacesByType(c *gin.Context) {
	spaceType := strings.TrimSpace(c.Param("type"))
	if spaceType == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space type",
			Message: "Space type cannot be empty",
		})
		return
	}

	// Validate space type
	if !h.isValidSpaceType(spaceType) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space type",
			Message: "Space type must be one of: meeting_room, office, auditorium, open_space, hot_desk, conference_room",
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetSpacesByType(spaceType, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetSpacesByStatus retrieves spaces with a specific status (managers/admins only)
// @Summary Get spaces by status
// @Description Retrieve spaces filtered by status (requires manager or admin role)
// @Tags spaces
// @Produce json
// @Param status path string true "Space status" Enums(available, maintenance, out_of_service, reserved)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/status/{status} [get]
func (h *SpaceHandler) GetSpacesByStatus(c *gin.Context) {
	status := strings.TrimSpace(c.Param("status"))
	if status == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid status",
			Message: "Status cannot be empty",
		})
		return
	}

	// Validate status
	if !h.isValidSpaceStatus(status) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid status",
			Message: "Status must be one of: available, maintenance, out_of_service, reserved",
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

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetSpacesByStatus(status, offset, limit, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetSpacesByCapacityRange retrieves spaces within a capacity range
// @Summary Get spaces by capacity range
// @Description Retrieve spaces with capacity within the specified range
// @Tags spaces
// @Produce json
// @Param min_capacity query int true "Minimum capacity" minimum(1)
// @Param max_capacity query int true "Maximum capacity" minimum(1)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/capacity [get]
func (h *SpaceHandler) GetSpacesByCapacityRange(c *gin.Context) {
	minCapacity := utils.GetIntQuery(c, "min_capacity", 0)
	maxCapacity := utils.GetIntQuery(c, "max_capacity", 0)

	// Validate capacity parameters
	if minCapacity <= 0 || maxCapacity <= 0 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid capacity range",
			Message: "Both min_capacity and max_capacity must be greater than 0",
		})
		return
	}

	if minCapacity > maxCapacity {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid capacity range",
			Message: "min_capacity must be less than or equal to max_capacity",
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetSpacesByCapacityRange(minCapacity, maxCapacity, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// AdvancedSpaceSearch performs advanced search with multiple filters
// @Summary Advanced space search
// @Description Perform advanced search with multiple filters and sorting options
// @Tags spaces
// @Accept json
// @Produce json
// @Param request body dto.SpaceFiltersRequest true "Advanced search filters"
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/advanced-search [post]
func (h *SpaceHandler) AdvancedSpaceSearch(c *gin.Context) {
	var req dto.SpaceFiltersRequest
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
			Error:   "Invalid search filters",
			Message: err.Error(),
		})
		return
	}

	// Validate and adjust pagination
	req.Page, req.Limit = h.validatePaginationParams(req.Page, req.Limit)
	offset := req.GetOffset()

	// Convert to repository filters
	filters := h.convertAdvancedFilters(&req)

	spaces, total, err := h.spaceService.SearchSpaces(filters, offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to search spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, req.Page, req.Limit)
	c.JSON(http.StatusOK, response)
}

// ========================================
// HELPER METHODS FOR PART 2
// ========================================

// convertToSpaceFilters converts search request to repository filters
func (h *SpaceHandler) convertToSpaceFilters(req *dto.SpaceSearchRequest) interfaces.SpaceFilters {
	filters := interfaces.SpaceFilters{
		Types:       req.Types,
		Buildings:   req.Buildings,
		Floors:      req.Floors,
		Status:      req.Status,
		SearchQuery: strings.TrimSpace(req.Query),
		SortBy:      req.SortBy,
		SortOrder:   req.SortOrder,
	}

	if req.MinCapacity != nil && *req.MinCapacity > 0 {
		filters.MinCapacity = req.MinCapacity
	}
	if req.MaxCapacity != nil && *req.MaxCapacity > 0 {
		filters.MaxCapacity = req.MaxCapacity
	}

	return filters
}

// convertAdvancedFilters converts advanced filters request to repository filters
func (h *SpaceHandler) convertAdvancedFilters(req *dto.SpaceFiltersRequest) interfaces.SpaceFilters {
	filters := interfaces.SpaceFilters{
		Types:            req.Types,
		Buildings:        req.Buildings,
		Floors:           req.Floors,
		Status:           req.Status,
		RequiresApproval: req.RequiresApproval,
		SortBy:           req.SortBy,
		SortOrder:        req.SortOrder,
	}

	if req.MinCapacity != nil && *req.MinCapacity > 0 {
		filters.MinCapacity = req.MinCapacity
	}
	if req.MaxCapacity != nil && *req.MaxCapacity > 0 {
		filters.MaxCapacity = req.MaxCapacity
	}

	if req.AvailableStartTime != nil && req.AvailableEndTime != nil {
		filters.AvailableStart = req.AvailableStartTime
		filters.AvailableEnd = req.AvailableEndTime
	}

	return filters
}

// isValidSpaceType validates if the space type is valid
func (h *SpaceHandler) isValidSpaceType(spaceType string) bool {
	validTypes := []string{
		"meeting_room",
		"office",
		"auditorium",
		"open_space",
		"hot_desk",
		"conference_room",
	}

	for _, validType := range validTypes {
		if spaceType == validType {
			return true
		}
	}
	return false
}

// isValidSpaceStatus validates if the space status is valid
func (h *SpaceHandler) isValidSpaceStatus(status string) bool {
	validStatuses := []string{
		"available",
		"maintenance",
		"out_of_service",
		"reserved",
	}

	for _, validStatus := range validStatuses {
		if status == validStatus {
			return true
		}
	}
	return false
}

// normalizeSearchQuery normalizes and validates search query
func (h *SpaceHandler) normalizeSearchQuery(query string) string {
	query = strings.TrimSpace(query)
	if len(query) > 100 { // Limit search query length
		query = query[:100]
	}
	return query
}

// validateSortParams validates sorting parameters
func (h *SpaceHandler) validateSortParams(sortBy, sortOrder string) (string, string) {
	validSortFields := map[string]bool{
		"name":       true,
		"capacity":   true,
		"building":   true,
		"floor":      true,
		"type":       true,
		"status":     true,
		"created_at": true,
	}

	if !validSortFields[sortBy] {
		sortBy = "name"
	}

	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	return sortBy, sortOrder
}

// ========================================
// AVAILABILITY OPERATIONS
// ========================================

// CheckSpaceAvailability checks if a space is available for a specific time period
// @Summary Check space availability
// @Description Check if a space is available for booking during a specific time period
// @Tags spaces
// @Accept json
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Param request body dto.SpaceAvailabilityRequest true "Availability check request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id}/availability [post]
func (h *SpaceHandler) CheckSpaceAvailability(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space ID",
			Message: "Space ID must be a valid UUID",
		})
		return
	}

	var req dto.SpaceAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Validate the request
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid availability request",
			Message: err.Error(),
		})
		return
	}

	// Additional validation
	if req.StartTime.After(req.EndTime) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid time range",
			Message: "Start time must be before end time",
		})
		return
	}

	if req.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid time range",
			Message: "Start time must be in the future",
		})
		return
	}

	availability, err := h.spaceService.CheckSpaceAvailability(spaceID, req.StartTime, req.EndTime)
	if err != nil {
		if err.Error() == "failed to get space: record not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Space not found",
				Message: "The requested space does not exist",
			})
			return
		}
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Failed to check availability",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Availability check completed",
		Data:    availability,
	})
}

// GetAvailableSpaces retrieves all spaces available for a specific time period
// @Summary Get available spaces
// @Description Retrieve all spaces that are available for booking during a specific time period
// @Tags spaces
// @Produce json
// @Param start_time query string true "Start time (RFC3339 format)" format(date-time)
// @Param end_time query string true "End time (RFC3339 format)" format(date-time)
// @Param min_capacity query int false "Minimum capacity required" minimum(1)
// @Param max_capacity query int false "Maximum capacity limit" minimum(1)
// @Param types query []string false "Space types filter" Enums(meeting_room, office, auditorium, open_space, hot_desk, conference_room)
// @Param buildings query []string false "Buildings filter"
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/available [get]
func (h *SpaceHandler) GetAvailableSpaces(c *gin.Context) {
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	if startTimeStr == "" || endTimeStr == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Missing required parameters",
			Message: "start_time and end_time are required parameters",
		})
		return
	}

	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid start_time",
			Message: "start_time must be in RFC3339 format (e.g., 2023-12-25T10:00:00Z)",
		})
		return
	}

	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid end_time",
			Message: "end_time must be in RFC3339 format (e.g., 2023-12-25T12:00:00Z)",
		})
		return
	}

	// Validate time range
	if startTime.After(endTime) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid time range",
			Message: "start_time must be before end_time",
		})
		return
	}

	if startTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid time range",
			Message: "start_time must be in the future",
		})
		return
	}

	// Validate duration (minimum 15 minutes, maximum 12 hours)
	duration := endTime.Sub(startTime)
	if duration < 15*time.Minute {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid duration",
			Message: "Booking duration must be at least 15 minutes",
		})
		return
	}

	if duration > 12*time.Hour {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid duration",
			Message: "Booking duration cannot exceed 12 hours",
		})
		return
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetAvailableSpaces(startTime, endTime, offset, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Failed to get available spaces",
			Message: err.Error(),
		})
		return
	}

	// Add additional metadata to response
	response := dto.NewPaginatedResponse(spaces, total, page, limit)

	c.JSON(http.StatusOK, response)
}

// UpdateSpaceStatus updates the status of a space (managers and admins)
// @Summary Update space status
// @Description Update the status of a space (available, maintenance, out_of_service, reserved)
// @Tags spaces
// @Accept json
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Param request body dto.UpdateSpaceStatusRequest true "Status update request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /manager/spaces/{id}/status [put]
func (h *SpaceHandler) UpdateSpaceStatus(c *gin.Context) {
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

	var req dto.UpdateSpaceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Validate status
	if !h.isValidSpaceStatus(req.Status) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid status",
			Message: "Status must be one of: available, maintenance, out_of_service, reserved",
		})
		return
	}

	// Create update request with just status
	updateReq := dto.UpdateSpaceRequest{
		Status: &req.Status,
	}

	// Update space using service method
	space, err := h.spaceService.UpdateSpace(spaceID, &updateReq, userID)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to update space status",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space status updated successfully",
		Data: map[string]interface{}{
			"space_id":   spaceID,
			"new_status": req.Status,
			"updated_at": time.Now(),
			"updated_by": userID,
			"reason":     req.Reason,
			"space":      space,
		},
	})
}

// BatchCheckAvailability checks availability for multiple spaces at once
// @Summary Batch availability check
// @Description Check availability for multiple spaces during a specific time period
// @Tags spaces
// @Accept json
// @Produce json
// @Param request body dto.BatchAvailabilityRequest true "Batch availability request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Router /spaces/batch-availability [post]
func (h *SpaceHandler) BatchCheckAvailability(c *gin.Context) {
	var req dto.BatchAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Validate request
	if len(req.SpaceIDs) == 0 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: "At least one space ID is required",
		})
		return
	}

	if len(req.SpaceIDs) > 50 { // Limit batch size
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Too many spaces",
			Message: "Cannot check more than 50 spaces at once",
		})
		return
	}

	if req.StartTime.After(req.EndTime) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid time range",
			Message: "Start time must be before end time",
		})
		return
	}

	if req.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid time range",
			Message: "Start time must be in the future",
		})
		return
	}

	results := make([]dto.SpaceAvailabilityResult, 0, len(req.SpaceIDs))

	for _, spaceID := range req.SpaceIDs {
		availability, err := h.spaceService.CheckSpaceAvailability(spaceID, req.StartTime, req.EndTime)

		result := dto.SpaceAvailabilityResult{
			SpaceID: spaceID,
		}

		if err != nil {
			result.Error = err.Error()
			result.Available = false
		} else {
			result.Available = availability.IsAvailable
			result.Conflicts = len(availability.Conflicts)
			if availability.NextAvailable != nil {
				result.NextAvailable = availability.NextAvailable
			}
		}

		results = append(results, result)
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Batch availability check completed",
		Data: map[string]interface{}{
			"results":         results,
			"total_checked":   len(req.SpaceIDs),
			"available_count": h.countAvailableSpaces(results),
		},
	})
}

// ========================================
// UTILITY ENDPOINTS
// ========================================

// GetSpaceOptions returns available options for space creation and filtering
// @Summary Get space options
// @Description Get available options for space types, statuses, buildings, etc.
// @Tags spaces
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/options [get]
func (h *SpaceHandler) GetSpaceOptions(c *gin.Context) {
	options, err := h.spaceService.GetSpaceOptions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get space options",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space options retrieved successfully",
		Data:    options,
	})
}

// GetBuildings returns all available buildings
// @Summary Get all buildings
// @Description Retrieve a list of all buildings that contain spaces
// @Tags spaces
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/buildings [get]
func (h *SpaceHandler) GetBuildings(c *gin.Context) {
	buildings, err := h.spaceService.GetDistinctBuildings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get buildings",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Buildings retrieved successfully",
		Data: map[string]interface{}{
			"buildings": buildings,
			"count":     len(buildings),
		},
	})
}

// GetFloors returns all available floors
// @Summary Get all floors
// @Description Retrieve a list of all floor numbers that contain spaces
// @Tags spaces
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/floors [get]
func (h *SpaceHandler) GetFloors(c *gin.Context) {
	floors, err := h.spaceService.GetDistinctFloors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get floors",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Floors retrieved successfully",
		Data: map[string]interface{}{
			"floors": floors,
			"count":  len(floors),
		},
	})
}

// GetSpaceStatistics returns basic statistics about spaces
// @Summary Get space statistics
// @Description Get basic statistics about spaces (counts by type, status, building)
// @Tags spaces
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/statistics [get]
func (h *SpaceHandler) GetSpaceStatistics(c *gin.Context) {
	totalSpaces, err := h.spaceService.GetSpaceCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get space statistics",
			Message: err.Error(),
		})
		return
	}

	// Get additional stats
	buildings, _ := h.spaceService.GetDistinctBuildings()
	floors, _ := h.spaceService.GetDistinctFloors()

	stats := map[string]interface{}{
		"total_spaces":    totalSpaces,
		"total_buildings": len(buildings),
		"total_floors":    len(floors),
		"last_updated":    time.Now(),
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space statistics retrieved successfully",
		Data:    stats,
	})
}

// ========================================
// HELPER METHODS FOR PART 3
// ========================================

// countAvailableSpaces counts available spaces in batch results
func (h *SpaceHandler) countAvailableSpaces(results []dto.SpaceAvailabilityResult) int {
	count := 0
	for _, result := range results {
		if result.Available {
			count++
		}
	}
	return count
}

// validateTimeRange validates a time range for availability checking
func (h *SpaceHandler) validateTimeRange(startTime, endTime time.Time) error {
	if startTime.After(endTime) {
		return errors.New("start time must be before end time")
	}

	if startTime.Before(time.Now()) {
		return errors.New("start time must be in the future")
	}

	duration := endTime.Sub(startTime)
	if duration < 15*time.Minute {
		return errors.New("duration must be at least 15 minutes")
	}

	if duration > 12*time.Hour {
		return errors.New("duration cannot exceed 12 hours")
	}

	return nil
}

// parseTimeQuery parses time query parameter with validation
func (h *SpaceHandler) parseTimeQuery(timeStr, fieldName string) (time.Time, error) {
	if timeStr == "" {
		return time.Time{}, fmt.Errorf("%s is required", fieldName)
	}

	parsedTime, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return time.Time{}, fmt.Errorf("%s must be in RFC3339 format", fieldName)
	}

	return parsedTime, nil
}

// Additional DTOs for Part 3 (these would normally be in your dto package)

// BatchAvailabilityRequest represents a batch availability check request
type BatchAvailabilityRequest struct {
	SpaceIDs  []uuid.UUID `json:"space_ids" binding:"required,min=1,max=50"`
	StartTime time.Time   `json:"start_time" binding:"required"`
	EndTime   time.Time   `json:"end_time" binding:"required"`
}

// SpaceAvailabilityResult represents the result of an availability check
type SpaceAvailabilityResult struct {
	SpaceID       uuid.UUID     `json:"space_id"`
	Available     bool          `json:"available"`
	Error         string        `json:"error,omitempty"`
	Conflicts     int           `json:"conflicts,omitempty"`
	NextAvailable *dto.TimeSlot `json:"next_available,omitempty"`
}

// ========================================
// MANAGER OPERATIONS
// ========================================

// GetSpacesByManager retrieves spaces managed by a specific manager
// @Summary Get spaces by manager
// @Description Retrieve all spaces managed by a specific manager (admin can view any, managers can view their own)
// @Tags spaces
// @Produce json
// @Param manager_id path string true "Manager ID" format(uuid)
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/manager/{manager_id} [get]
func (h *SpaceHandler) GetSpacesByManager(c *gin.Context) {
	managerID, err := uuid.Parse(c.Param("manager_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid manager ID",
			Message: "Manager ID must be a valid UUID",
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

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 20)
	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetSpacesByManager(managerID, offset, limit, userID)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get managed spaces",
			Message: err.Error(),
		})
		return
	}

	response := dto.NewPaginatedResponse(spaces, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetMyManagedSpaces retrieves spaces managed by the current user
// @Summary Get my managed spaces
// @Description Retrieve all spaces managed by the currently authenticated manager
// @Tags spaces
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(20) minimum(1) maximum(100)
// @Param include_stats query bool false "Include space statistics" default(false)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/my-managed [get]
func (h *SpaceHandler) GetMyManagedSpaces(c *gin.Context) {
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
	includeStats := c.Query("include_stats") == "true"

	page, limit = h.validatePaginationParams(page, limit)
	offset := (page - 1) * limit

	spaces, total, err := h.spaceService.GetSpacesByManager(userID, offset, limit, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get managed spaces",
			Message: err.Error(),
		})
		return
	}

	// Enhance response with statistics if requested
	responseData := spaces
	if includeStats && len(spaces) > 0 {
		enhancedSpaces := make([]interface{}, len(spaces))
		for i, space := range spaces {
			spaceData := map[string]interface{}{
				"space": space,
			}

			// Add reservation count if requested
			if count, err := h.spaceService.GetSpaceReservationCount(space.ID, userID); err == nil {
				spaceData["reservation_count"] = count
			}

			enhancedSpaces[i] = spaceData
		}
		// responseData = enhancedSpaces
	}

	response := dto.NewPaginatedResponse(responseData, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// AssignManager assigns a manager to a space (admin only)
// @Summary Assign manager to space
// @Description Assign a manager to a specific space (admin only)
// @Tags spaces
// @Accept json
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Param request body dto.AssignManagerRequest true "Manager assignment request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id}/assign-manager [post]
func (h *SpaceHandler) AssignManager(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid space ID",
			Message: "Space ID must be a valid UUID",
		})
		return
	}

	var req dto.AssignManagerRequest
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

	err = h.spaceService.AssignManager(spaceID, req.ManagerID, userID)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "only administrators can assign managers" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to assign manager",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Manager assigned successfully",
	})
}

// UnassignManager removes a manager from a space (admin only)
// @Summary Unassign manager from space
// @Description Remove manager assignment from a specific space (admin only)
// @Tags spaces
// @Param id path string true "Space ID" format(uuid)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id}/unassign-manager [delete]
func (h *SpaceHandler) UnassignManager(c *gin.Context) {
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

	err = h.spaceService.UnassignManager(spaceID, userID)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "only administrators can unassign managers" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to unassign manager",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Manager unassigned successfully",
	})
}

// ========================================
// STATISTICS AND ANALYTICS
// ========================================

// GetSpaceReservationCount gets total reservation count for a space
// @Summary Get space reservation count
// @Description Get the total number of reservations for a specific space
// @Tags spaces
// @Produce json
// @Param id path string true "Space ID" format(uuid)
// @Param period query string false "Time period" Enums(all, week, month, year) default(all)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /spaces/{id}/reservation-count [get]
func (h *SpaceHandler) GetSpaceReservationCount(c *gin.Context) {
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

	count, err := h.spaceService.GetSpaceReservationCount(spaceID, userID)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "access denied" {
			status = http.StatusForbidden
		}
		c.JSON(status, dto.ErrorResponse{
			Error:   "Failed to get reservation count",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Reservation count retrieved successfully",
		Data: map[string]interface{}{
			"space_id":          spaceID,
			"reservation_count": count,
			"period":            c.DefaultQuery("period", "all"),
			"generated_at":      time.Now(),
		},
	})
}

// GetSpaceCountByStatus gets space count by status (managers/admins only)
// @Summary Get space count by status
// @Description Get the count of spaces filtered by status (requires manager or admin role)
// @Tags spaces
// @Produce json
// @Param status path string true "Space status" Enums(available, maintenance, out_of_service, reserved)
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Router /spaces/count/status/{status} [get]
func (h *SpaceHandler) GetSpaceCountByStatus(c *gin.Context) {
	status := c.Param("status")
	if !h.isValidSpaceStatus(status) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid status",
			Message: "Status must be one of: available, maintenance, out_of_service, reserved",
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

	count, err := h.spaceService.GetSpaceCountByStatus(status, userID)
	if err != nil {
		httpStatus := http.StatusBadRequest
		if err.Error() == "access denied" {
			httpStatus = http.StatusForbidden
		}
		c.JSON(httpStatus, dto.ErrorResponse{
			Error:   "Failed to get space count",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space count retrieved successfully",
		Data: map[string]interface{}{
			"status": status,
			"count":  count,
		},
	})
}

// GetSpaceCountByBuilding gets space count by building
// @Summary Get space count by building
// @Description Get the count of spaces in a specific building
// @Tags spaces
// @Produce json
// @Param building path string true "Building name"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Router /spaces/count/building/{building} [get]
func (h *SpaceHandler) GetSpaceCountByBuilding(c *gin.Context) {
	building := c.Param("building")
	if building == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid building name",
			Message: "Building name cannot be empty",
		})
		return
	}

	count, err := h.spaceService.GetSpaceCountByBuilding(building)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get space count",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Space count retrieved successfully",
		Data: map[string]interface{}{
			"building": building,
			"count":    count,
		},
	})
}

// GetDashboardStatistics returns dashboard statistics for managers and admins
// @Summary Get dashboard statistics
// @Description Get comprehensive dashboard statistics for spaces and reservations
// @Tags spaces
// @Produce json
// @Param period query string false "Statistics period" Enums(week, month, quarter, year) default(month)
// @Success 200 {object} dto.SuccessResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /spaces/dashboard [get]
func (h *SpaceHandler) GetDashboardStatistics(c *gin.Context) {
	userID, err := h.extractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: err.Error(),
		})
		return
	}

	period := c.DefaultQuery("period", "month")
	if !h.isValidPeriod(period) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid period",
			Message: "Period must be one of: week, month, quarter, year",
		})
		return
	}

	// Get basic space statistics
	totalSpaces, err := h.spaceService.GetSpaceCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get statistics",
			Message: err.Error(),
		})
		return
	}

	// Get additional statistics
	buildings, _ := h.spaceService.GetDistinctBuildings()
	floors, _ := h.spaceService.GetDistinctFloors()

	// Build dashboard statistics
	dashboard := map[string]interface{}{
		"overview": map[string]interface{}{
			"total_spaces":    totalSpaces,
			"total_buildings": len(buildings),
			"total_floors":    len(floors),
		},
		"period":       period,
		"generated_at": time.Now(),
	}

	// Add status breakdown if user has permission
	if statusCounts, err := h.getStatusBreakdown(userID); err == nil {
		dashboard["status_breakdown"] = statusCounts
	}

	// Add building breakdown
	if buildingStats, err := h.getBuildingBreakdown(); err == nil {
		dashboard["building_breakdown"] = buildingStats
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Dashboard statistics retrieved successfully",
		Data:    dashboard,
	})
}

// ========================================
// HELPER METHODS FOR PART 4
// ========================================

// getStatusBreakdown gets space count breakdown by status
func (h *SpaceHandler) getStatusBreakdown(userID uuid.UUID) (map[string]interface{}, error) {
	statuses := []string{"available", "maintenance", "out_of_service", "reserved"}
	breakdown := make(map[string]interface{})

	for _, status := range statuses {
		if count, err := h.spaceService.GetSpaceCountByStatus(status, userID); err == nil {
			breakdown[status] = count
		}
	}

	return breakdown, nil
}

// getBuildingBreakdown gets space count breakdown by building
func (h *SpaceHandler) getBuildingBreakdown() ([]map[string]interface{}, error) {
	buildings, err := h.spaceService.GetDistinctBuildings()
	if err != nil {
		return nil, err
	}

	var breakdown []map[string]interface{}
	for _, building := range buildings {
		if count, err := h.spaceService.GetSpaceCountByBuilding(building); err == nil {
			breakdown = append(breakdown, map[string]interface{}{
				"building": building,
				"count":    count,
			})
		}
	}

	return breakdown, nil
}

// isValidPeriod validates if the period is valid
func (h *SpaceHandler) isValidPeriod(period string) bool {
	validPeriods := []string{"week", "month", "quarter", "year"}
	for _, validPeriod := range validPeriods {
		if period == validPeriod {
			return true
		}
	}
	return false
}

// calculateDateRange calculates start and end dates for a given period
func (h *SpaceHandler) calculateDateRange(period string) (time.Time, time.Time) {
	now := time.Now()
	var startDate, endDate time.Time

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
		endDate = now
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

// Additional DTOs for Part 4 (these would normally be in your dto package)

// AssignManagerRequest represents a manager assignment request
type AssignManagerRequest struct {
	ManagerID uuid.UUID `json:"manager_id" binding:"required"`
}

// SpaceStatisticsResponse represents space statistics
type SpaceStatisticsResponse struct {
	SpaceID           uuid.UUID `json:"space_id"`
	TotalReservations int64     `json:"total_reservations"`
	Period            string    `json:"period"`
	GeneratedAt       time.Time `json:"generated_at"`
}
