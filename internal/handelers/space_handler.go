// internal/handlers/space_handler.go
package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/services"
)

type SpaceHandler struct {
	spaceService *services.SpaceService
}

// NewSpaceHandler creates a new space handler
func NewSpaceHandler(spaceService *services.SpaceService) *SpaceHandler {
	return &SpaceHandler{
		spaceService: spaceService,
	}
}

// GetSpaces handles GET /api/v1/spaces
func (h *SpaceHandler) GetSpaces(c *gin.Context) {
	var req dto.SpaceFiltersRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewValidationErrorResponse([]dto.ValidationError{
			{Field: "query", Message: err.Error(), Code: "VALIDATION_ERROR"},
		}))
		return
	}

	// Set defaults
	req.SetDefaults()

	// Validate request
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid request parameters"))
		return
	}

	// Get spaces from service
	spaces, total, err := h.spaceService.GetSpaces(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to retrieve spaces"))
		return
	}

	// Convert to response DTOs
	spaceResponses := make([]dto.SpaceResponse, len(spaces))
	for i, space := range spaces {
		spaceResponses[i] = h.convertToSpaceResponse(space)
	}

	// Create pagination metadata
	pagination := dto.NewPaginationMeta(req.Page, int(total), req.Limit)

	// Create response
	response := dto.NewSpaceListResponse(spaceResponses, pagination)

	c.JSON(http.StatusOK, response)
}

// GetSpace handles GET /api/v1/spaces/:id
func (h *SpaceHandler) GetSpace(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid space ID"))
		return
	}

	space, err := h.spaceService.GetSpaceByID(spaceID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, dto.NewNotFoundError("Space"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to retrieve space"))
		return
	}

	// Convert to detailed response
	response := h.convertToSpaceDetailsResponse(space)

	c.JSON(http.StatusOK, response)
}

// GetSpaceAvailability handles GET /api/v1/spaces/:id/availability
func (h *SpaceHandler) GetSpaceAvailability(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid space ID"))
		return
	}

	var req dto.SpaceAvailabilityRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewValidationErrorResponse([]dto.ValidationError{
			{Field: "query", Message: err.Error(), Code: "VALIDATION_ERROR"},
		}))
		return
	}

	req.SpaceID = spaceID

	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid request parameters"))
		return
	}

	availability, err := h.spaceService.CheckAvailability(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to check availability"))
		return
	}

	c.JSON(http.StatusOK, availability)
}

// SearchSpaces handles GET /api/v1/spaces/search
func (h *SpaceHandler) SearchSpaces(c *gin.Context) {
	var req dto.SpaceSearchRequest

	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewValidationErrorResponse([]dto.ValidationError{
			{Field: "query", Message: err.Error(), Code: "VALIDATION_ERROR"},
		}))
		return
	}

	req.SetDefaults()

	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid search parameters"))
		return
	}

	spaces, total, err := h.spaceService.SearchSpaces(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to search spaces"))
		return
	}

	// Convert to response DTOs
	spaceResponses := make([]dto.SpaceResponse, len(spaces))
	for i, space := range spaces {
		spaceResponses[i] = h.convertToSpaceResponse(space)
	}

	// Create pagination metadata
	pagination := dto.NewPaginationMeta(req.Page, int(total), req.Limit)

	// Create search response
	response := &dto.SpaceSearchResponse{
		Spaces:     spaceResponses,
		Pagination: pagination,
		Filters: dto.SearchFilters{
			Types:       req.Types,
			Buildings:   req.Buildings,
			Floors:      req.Floors,
			MinCapacity: req.MinCapacity,
			MaxCapacity: req.MaxCapacity,
			Status:      req.Status,
			SortBy:      req.SortBy,
			SortOrder:   req.SortOrder,
		},
	}

	c.JSON(http.StatusOK, response)
}

// CreateSpace handles POST /api/v1/admin/spaces
func (h *SpaceHandler) CreateSpace(c *gin.Context) {
	var req dto.CreateSpaceRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewValidationErrorResponse([]dto.ValidationError{
			{Field: "body", Message: err.Error(), Code: "VALIDATION_ERROR"},
		}))
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Create space
	space, err := h.spaceService.CreateSpace(&req, userID.(uuid.UUID))
	if err != nil {
		// Handle specific errors
		if strings.Contains(err.Error(), "duplicate") {
			c.JSON(http.StatusConflict, dto.NewConflictError("Space with same name already exists in this building"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to create space"))
		return
	}

	response := h.convertToSpaceResponse(space)
	c.JSON(http.StatusCreated, response)
}

// UpdateSpace handles PUT /api/v1/admin/spaces/:id
func (h *SpaceHandler) UpdateSpace(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid space ID"))
		return
	}

	var req dto.UpdateSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewValidationErrorResponse([]dto.ValidationError{
			{Field: "body", Message: err.Error(), Code: "VALIDATION_ERROR"},
		}))
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Update space
	space, err := h.spaceService.UpdateSpace(spaceID, &req, userID.(uuid.UUID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, dto.NewNotFoundError("Space"))
			return
		}
		if strings.Contains(err.Error(), "duplicate") {
			c.JSON(http.StatusConflict, dto.NewConflictError("Space with same name already exists in this building"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to update space"))
		return
	}

	response := h.convertToSpaceResponse(space)
	c.JSON(http.StatusOK, response)
}

// DeleteSpace handles DELETE /api/v1/admin/spaces/:id
func (h *SpaceHandler) DeleteSpace(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid space ID"))
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Delete space
	err = h.spaceService.DeleteSpace(spaceID, userID.(uuid.UUID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, dto.NewNotFoundError("Space"))
			return
		}
		if strings.Contains(err.Error(), "has active reservations") {
			c.JSON(http.StatusConflict, dto.NewConflictError("Cannot delete space with active reservations"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to delete space"))
		return
	}

	c.JSON(http.StatusOK, dto.NewMessageResponse("Space deleted successfully", true))
}

// BulkUpdateSpaceStatus handles PUT /api/v1/admin/spaces/bulk/status
func (h *SpaceHandler) BulkUpdateSpaceStatus(c *gin.Context) {
	var req dto.BulkSpaceStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.NewValidationErrorResponse([]dto.ValidationError{
			{Field: "body", Message: err.Error(), Code: "VALIDATION_ERROR"},
		}))
		return
	}

	// Get current user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Bulk update
	result, err := h.spaceService.BulkUpdateStatus(&req, userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to update spaces"))
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetSpaceOptions handles GET /api/v1/admin/spaces/options
func (h *SpaceHandler) GetSpaceOptions(c *gin.Context) {
	options, err := h.spaceService.GetSpaceOptions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to retrieve space options"))
		return
	}

	c.JSON(http.StatusOK, options)
}

// GetSpaceAnalytics handles GET /api/v1/admin/spaces/:id/analytics
func (h *SpaceHandler) GetSpaceAnalytics(c *gin.Context) {
	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(err, "Invalid space ID"))
		return
	}

	period := c.DefaultQuery("period", "month") // week, month, year

	analytics, err := h.spaceService.GetSpaceAnalytics(spaceID, period)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, dto.NewNotFoundError("Space"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to retrieve analytics"))
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetSpacesByBuilding handles GET /api/v1/spaces/building/:building
func (h *SpaceHandler) GetSpacesByBuilding(c *gin.Context) {
	building := c.Param("building")
	if building == "" {
		c.JSON(http.StatusBadRequest, dto.NewErrorResponse(dto.ErrRequiredField, "Building parameter is required"))
		return
	}

	// Get query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	floor := c.Query("floor")
	spaceType := c.Query("type")

	// Build filter request
	req := &dto.SpaceFiltersRequest{
		Buildings: []string{building},
		Page:      page,
		Limit:     limit,
	}

	if floor != "" {
		if f, err := strconv.Atoi(floor); err == nil {
			req.Floors = []int{f}
		}
	}

	if spaceType != "" {
		req.Types = []string{spaceType}
	}

	req.SetDefaults()

	spaces, total, err := h.spaceService.GetSpaces(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to retrieve spaces"))
		return
	}

	// Convert to response DTOs
	spaceResponses := make([]dto.SpaceResponse, len(spaces))
	for i, space := range spaces {
		spaceResponses[i] = h.convertToSpaceResponse(space)
	}

	// Create pagination metadata
	pagination := dto.NewPaginationMeta(req.Page, int(total), req.Limit)

	response := dto.NewSpaceListResponse(spaceResponses, pagination)
	c.JSON(http.StatusOK, response)
}

// GetBuildings handles GET /api/v1/spaces/buildings
func (h *SpaceHandler) GetBuildings(c *gin.Context) {
	buildings, err := h.spaceService.GetBuildings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.NewInternalServerError("Failed to retrieve buildings"))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"buildings": buildings,
		"count":     len(buildings),
	})
}

// Helper methods for conversion

// convertToSpaceResponse converts a Space model to SpaceResponse DTO
func (h *SpaceHandler) convertToSpaceResponse(space *models.Space) dto.SpaceResponse {
	return dto.SpaceResponse{
		ID:                 space.ID,
		Name:               space.Name,
		Type:               string(space.Type),
		Capacity:           space.Capacity,
		Building:           space.Building,
		Floor:              space.Floor,
		RoomNumber:         space.RoomNumber,
		Equipment:          h.convertEquipmentFromJSON(space.Equipment),
		Status:             string(space.Status),
		Description:        space.Description,
		Surface:            space.Surface,
		Photos:             h.convertPhotosFromJSON(space.Photos),
		PricePerHour:       space.PricePerHour,
		PricePerDay:        space.PricePerDay,
		PricePerMonth:      space.PricePerMonth,
		ManagerID:          space.ManagerID,
		Manager:            h.convertManagerToUserResponse(space.Manager),
		RequiresApproval:   space.RequiresApproval,
		BookingAdvanceTime: space.BookingAdvanceTime,
		MaxBookingDuration: space.MaxBookingDuration,
		FullLocation:       space.GetFullLocation(),
		IsAvailable:        space.IsAvailable(),
		CreatedAt:          space.CreatedAt,
		UpdatedAt:          space.UpdatedAt,
	}
}

// convertToSpaceDetailsResponse converts a Space model to SpaceDetailsResponse DTO
func (h *SpaceHandler) convertToSpaceDetailsResponse(space *models.Space) *dto.SpaceDetailsResponse {
	baseResponse := h.convertToSpaceResponse(space)

	return &dto.SpaceDetailsResponse{
		SpaceResponse: &baseResponse,
		// RecentReservations and other fields would be populated by the service
		// This is a placeholder implementation
	}
}

// convertEquipmentFromJSON converts JSONB equipment to Equipment slice
func (h *SpaceHandler) convertEquipmentFromJSON(equipmentJSON interface{}) []dto.Equipment {
	// Implementation depends on how you store equipment in JSONB
	// This is a placeholder - you'll need to implement based on your JSON structure
	return []dto.Equipment{}
}

// convertPhotosFromJSON converts JSONB photos to string slice
func (h *SpaceHandler) convertPhotosFromJSON(photosJSON interface{}) []string {
	// Implementation depends on how you store photos in JSONB
	// This is a placeholder - you'll need to implement based on your JSON structure
	return []string{}
}

// convertManagerToUserResponse converts Manager to UserResponse
func (h *SpaceHandler) convertManagerToUserResponse(manager *models.User) *dto.UserResponse {
	if manager == nil {
		return nil
	}

	// This assumes you have a UserResponse DTO defined
	// You'll need to implement this based on your User model structure
	return &dto.UserResponse{
		ID:        manager.ID,
		FirstName: manager.FirstName,
		LastName:  manager.LastName,
		Email:     manager.Email,
		Role:      manager.Role,
	}
}
