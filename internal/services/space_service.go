// internal/services/space_service.go
package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"room-reservation-api/internal/models"
)

var (
	ErrSpaceNotFound      = errors.New("space not found")
	ErrSpaceAlreadyExists = errors.New("space already exists")
	ErrInvalidTimeRange   = errors.New("invalid time range")
	ErrSpaceNotAvailable  = errors.New("space not available")
)

type SpaceService struct {
	db *gorm.DB
}

func NewSpaceService(db *gorm.DB) *SpaceService {
	return &SpaceService{db: db}
}

// SpaceFilter represents filters for space queries
type SpaceFilter struct {
	Type      string     `form:"type"`
	Capacity  int        `form:"capacity"`
	Building  string     `form:"building"`
	Floor     *int       `form:"floor"`
	Status    string     `form:"status"`
	StartTime time.Time  `form:"start_time"`
	EndTime   time.Time  `form:"end_time"`
	Equipment []string   `form:"equipment"`
	ManagerID *uuid.UUID `form:"manager_id"`
	Search    string     `form:"search"`
	Page      int        `form:"page,default=1"`
	Limit     int        `form:"limit,default=20"`
	SortBy    string     `form:"sort_by,default=name"`
	SortOrder string     `form:"sort_order,default=asc"`
}

// PaginatedSpaceResponse represents paginated space response
type PaginatedSpaceResponse struct {
	Data       []models.Space `json:"data"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

// CreateSpaceRequest represents space creation request
type CreateSpaceRequest struct {
	Name               string             `json:"name" validate:"required,min=2,max=100"`
	Type               models.SpaceType   `json:"type" validate:"required"`
	Capacity           int                `json:"capacity" validate:"required,min=1,max=1000"`
	Building           string             `json:"building" validate:"required"`
	Floor              int                `json:"floor" validate:"required"`
	RoomNumber         string             `json:"room_number" validate:"required"`
	Equipment          []models.Equipment `json:"equipment"`
	Description        string             `json:"description"`
	Surface            float64            `json:"surface" validate:"omitempty,min=0"`
	Photos             []string           `json:"photos"`
	PricePerHour       float64            `json:"price_per_hour" validate:"omitempty,min=0"`
	PricePerDay        float64            `json:"price_per_day" validate:"omitempty,min=0"`
	PricePerMonth      float64            `json:"price_per_month" validate:"omitempty,min=0"`
	ManagerID          *uuid.UUID         `json:"manager_id"`
	RequiresApproval   bool               `json:"requires_approval"`
	BookingAdvanceTime int                `json:"booking_advance_time"`
	MaxBookingDuration int                `json:"max_booking_duration"`
}

// UpdateSpaceRequest represents space update request
type UpdateSpaceRequest struct {
	Name               *string             `json:"name" validate:"omitempty,min=2,max=100"`
	Type               *models.SpaceType   `json:"type"`
	Capacity           *int                `json:"capacity" validate:"omitempty,min=1,max=1000"`
	Building           *string             `json:"building"`
	Floor              *int                `json:"floor"`
	RoomNumber         *string             `json:"room_number"`
	Equipment          []models.Equipment  `json:"equipment"`
	Status             *models.SpaceStatus `json:"status"`
	Description        *string             `json:"description"`
	Surface            *float64            `json:"surface" validate:"omitempty,min=0"`
	Photos             []string            `json:"photos"`
	PricePerHour       *float64            `json:"price_per_hour" validate:"omitempty,min=0"`
	PricePerDay        *float64            `json:"price_per_day" validate:"omitempty,min=0"`
	PricePerMonth      *float64            `json:"price_per_month" validate:"omitempty,min=0"`
	ManagerID          *uuid.UUID          `json:"manager_id"`
	RequiresApproval   *bool               `json:"requires_approval"`
	BookingAdvanceTime *int                `json:"booking_advance_time"`
	MaxBookingDuration *int                `json:"max_booking_duration"`
}

// AvailabilityRequest represents availability check request
type AvailabilityRequest struct {
	StartTime time.Time `json:"start_time" validate:"required"`
	EndTime   time.Time `json:"end_time" validate:"required"`
	SpaceID   uuid.UUID `json:"space_id" validate:"required"`
}

// AvailabilityResponse represents availability check response
type AvailabilityResponse struct {
	Available               bool                 `json:"available"`
	Space                   models.Space         `json:"space"`
	ConflictingReservations []models.Reservation `json:"conflicting_reservations,omitempty"`
	Suggestions             []models.Space       `json:"suggestions,omitempty"`
}

// GetSpaces retrieves spaces with filters and pagination
func (s *SpaceService) GetSpaces(filter SpaceFilter) (*PaginatedSpaceResponse, error) {
	query := s.db.Model(&models.Space{}).Preload("Manager")

	// Apply filters
	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}
	if filter.Capacity > 0 {
		query = query.Where("capacity >= ?", filter.Capacity)
	}
	if filter.Building != "" {
		query = query.Where("building ILIKE ?", "%"+filter.Building+"%")
	}
	if filter.Floor != nil {
		query = query.Where("floor = ?", *filter.Floor)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.ManagerID != nil {
		query = query.Where("manager_id = ?", *filter.ManagerID)
	}
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
	}

	// Filter by availability if time range is provided
	if !filter.StartTime.IsZero() && !filter.EndTime.IsZero() {
		// Subquery to find spaces that don't have conflicting reservations
		subQuery := s.db.Model(&models.Reservation{}).
			Select("space_id").
			Where("status IN ?", []models.ReservationStatus{models.StatusConfirmed, models.StatusPending}).
			Where("start_time < ? AND end_time > ?", filter.EndTime, filter.StartTime)

		query = query.Where("id NOT IN (?)", subQuery)
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count spaces: %w", err)
	}

	// Apply sorting
	orderClause := filter.SortBy
	if filter.SortOrder == "desc" {
		orderClause += " DESC"
	}
	query = query.Order(orderClause)

	// Apply pagination
	offset := (filter.Page - 1) * filter.Limit
	query = query.Offset(offset).Limit(filter.Limit)

	var spaces []models.Space
	if err := query.Find(&spaces).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch spaces: %w", err)
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return &PaginatedSpaceResponse{
		Data:       spaces,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetSpaceByID retrieves a space by ID
func (s *SpaceService) GetSpaceByID(id uuid.UUID) (*models.Space, error) {
	var space models.Space
	if err := s.db.Preload("Manager").Where("id = ?", id).First(&space).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSpaceNotFound
		}
		return nil, fmt.Errorf("failed to fetch space: %w", err)
	}

	return &space, nil
}

// CreateSpace creates a new space
func (s *SpaceService) CreateSpace(req CreateSpaceRequest) (*models.Space, error) {
	// Check if space with same name and building already exists
	var existingSpace models.Space
	if err := s.db.Where("name = ? AND building = ?", req.Name, req.Building).First(&existingSpace).Error; err == nil {
		return nil, ErrSpaceAlreadyExists
	}

	// Validate manager exists if provided
	if req.ManagerID != nil {
		var manager models.User
		if err := s.db.Where("id = ? AND role IN ?", *req.ManagerID, []models.UserRole{models.RoleManager, models.RoleAdmin}).First(&manager).Error; err != nil {
			return nil, fmt.Errorf("invalid manager ID: %w", err)
		}
	}

	space := &models.Space{
		ID:                 uuid.New(),
		Name:               req.Name,
		Type:               req.Type,
		Capacity:           req.Capacity,
		Building:           req.Building,
		Floor:              req.Floor,
		RoomNumber:         req.RoomNumber,
		Description:        req.Description,
		Surface:            req.Surface,
		PricePerHour:       req.PricePerHour,
		PricePerDay:        req.PricePerDay,
		PricePerMonth:      req.PricePerMonth,
		ManagerID:          req.ManagerID,
		RequiresApproval:   req.RequiresApproval,
		BookingAdvanceTime: req.BookingAdvanceTime,
		MaxBookingDuration: req.MaxBookingDuration,
		Status:             models.SpaceStatusAvailable,
	}

	// Handle equipment and photos JSON
	// TODO: Implement JSON marshaling for equipment and photos

	if err := s.db.Create(space).Error; err != nil {
		return nil, fmt.Errorf("failed to create space: %w", err)
	}

	return space, nil
}

// UpdateSpace updates an existing space
func (s *SpaceService) UpdateSpace(id uuid.UUID, req UpdateSpaceRequest) (*models.Space, error) {
	var space models.Space
	if err := s.db.Where("id = ?", id).First(&space).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSpaceNotFound
		}
		return nil, fmt.Errorf("failed to fetch space: %w", err)
	}

	// Validate manager exists if provided
	if req.ManagerID != nil {
		var manager models.User
		if err := s.db.Where("id = ? AND role IN ?", *req.ManagerID, []models.UserRole{models.RoleManager, models.RoleAdmin}).First(&manager).Error; err != nil {
			return nil, fmt.Errorf("invalid manager ID: %w", err)
		}
	}

	// Update fields if provided
	if req.Name != nil {
		space.Name = *req.Name
	}
	if req.Type != nil {
		space.Type = *req.Type
	}
	if req.Capacity != nil {
		space.Capacity = *req.Capacity
	}
	if req.Building != nil {
		space.Building = *req.Building
	}
	if req.Floor != nil {
		space.Floor = *req.Floor
	}
	if req.RoomNumber != nil {
		space.RoomNumber = *req.RoomNumber
	}
	if req.Status != nil {
		space.Status = *req.Status
	}
	if req.Description != nil {
		space.Description = *req.Description
	}
	if req.Surface != nil {
		space.Surface = *req.Surface
	}
	if req.PricePerHour != nil {
		space.PricePerHour = *req.PricePerHour
	}
	if req.PricePerDay != nil {
		space.PricePerDay = *req.PricePerDay
	}
	if req.PricePerMonth != nil {
		space.PricePerMonth = *req.PricePerMonth
	}
	if req.ManagerID != nil {
		space.ManagerID = req.ManagerID
	}
	if req.RequiresApproval != nil {
		space.RequiresApproval = *req.RequiresApproval
	}
	if req.BookingAdvanceTime != nil {
		space.BookingAdvanceTime = *req.BookingAdvanceTime
	}
	if req.MaxBookingDuration != nil {
		space.MaxBookingDuration = *req.MaxBookingDuration
	}

	// TODO: Handle equipment and photos JSON updates

	if err := s.db.Save(&space).Error; err != nil {
		return nil, fmt.Errorf("failed to update space: %w", err)
	}

	return &space, nil
}

// DeleteSpace soft deletes a space
func (s *SpaceService) DeleteSpace(id uuid.UUID) error {
	var space models.Space
	if err := s.db.Where("id = ?", id).First(&space).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSpaceNotFound
		}
		return fmt.Errorf("failed to fetch space: %w", err)
	}

	// Check if space has active reservations
	var activeReservations int64
	if err := s.db.Model(&models.Reservation{}).
		Where("space_id = ? AND status IN ? AND end_time > ?",
			id,
			[]models.ReservationStatus{models.StatusConfirmed, models.StatusPending},
			time.Now()).
		Count(&activeReservations).Error; err != nil {
		return fmt.Errorf("failed to check active reservations: %w", err)
	}

	if activeReservations > 0 {
		return fmt.Errorf("cannot delete space with active reservations")
	}

	if err := s.db.Delete(&space).Error; err != nil {
		return fmt.Errorf("failed to delete space: %w", err)
	}

	return nil
}

// CheckAvailability checks if a space is available for the given time range
func (s *SpaceService) CheckAvailability(req AvailabilityRequest) (*AvailabilityResponse, error) {
	if req.EndTime.Before(req.StartTime) || req.EndTime.Equal(req.StartTime) {
		return nil, ErrInvalidTimeRange
	}

	// Get the space
	space, err := s.GetSpaceByID(req.SpaceID)
	if err != nil {
		return nil, err
	}

	// Check if space is available status
	if !space.IsAvailable() {
		return &AvailabilityResponse{
			Available: false,
			Space:     *space,
		}, nil
	}

	// Check for conflicting reservations
	var conflictingReservations []models.Reservation
	if err := s.db.Where("space_id = ? AND status IN ? AND start_time < ? AND end_time > ?",
		req.SpaceID,
		[]models.ReservationStatus{models.StatusConfirmed, models.StatusPending},
		req.EndTime,
		req.StartTime).
		Find(&conflictingReservations).Error; err != nil {
		return nil, fmt.Errorf("failed to check conflicts: %w", err)
	}

	available := len(conflictingReservations) == 0

	response := &AvailabilityResponse{
		Available: available,
		Space:     *space,
	}

	if !available {
		response.ConflictingReservations = conflictingReservations

		// Get alternative suggestions
		suggestions, err := s.getSuggestions(req)
		if err == nil {
			response.Suggestions = suggestions
		}
	}

	return response, nil
}

// getSuggestions finds alternative spaces for the given time range
func (s *SpaceService) getSuggestions(req AvailabilityRequest) ([]models.Space, error) {
	// Get original space details for similar suggestions
	originalSpace, err := s.GetSpaceByID(req.SpaceID)
	if err != nil {
		return nil, err
	}

	filter := SpaceFilter{
		Type:      string(originalSpace.Type),
		Capacity:  originalSpace.Capacity,
		Building:  originalSpace.Building,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Limit:     5,
	}

	result, err := s.GetSpaces(filter)
	if err != nil {
		return nil, err
	}

	// Filter out the original space
	var suggestions []models.Space
	for _, space := range result.Data {
		if space.ID != req.SpaceID {
			suggestions = append(suggestions, space)
		}
	}

	return suggestions, nil
}
