// internal/services/space_service.go
package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"
)

type SpaceService struct {
	spaceRepo       interfaces.SpaceRepositoryInterface
	userRepo        interfaces.UserRepositoryInterface
	reservationRepo interfaces.ReservationRepositoryInterface
}

// NewSpaceService creates a new space service
func NewSpaceService(
	spaceRepo interfaces.SpaceRepositoryInterface,
	userRepo interfaces.UserRepositoryInterface,
	reservationRepo interfaces.ReservationRepositoryInterface,
) *SpaceService {
	return &SpaceService{
		spaceRepo:       spaceRepo,
		userRepo:        userRepo,
		reservationRepo: reservationRepo,
	}
}

// GetSpaces retrieves spaces with filtering and pagination
func (s *SpaceService) GetSpaces(req *dto.SpaceFiltersRequest) ([]*models.Space, int64, error) {
	// Build filters
	filters := s.buildSpaceFilters(req)

	// Get spaces from repository
	spaces, total, err := s.spaceRepo.GetSpacesWithFilters(filters, req.GetOffset(), req.Limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces: %w", err)
	}

	return spaces, total, nil
}

// GetSpaceByID retrieves a space by its ID
func (s *SpaceService) GetSpaceByID(spaceID uuid.UUID) (*models.Space, error) {
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	return space, nil
}

// SearchSpaces searches for spaces with query and filters
func (s *SpaceService) SearchSpaces(req *dto.SpaceSearchRequest) ([]*models.Space, int64, error) {
	// Convert search request to filters request
	filters := &dto.SpaceFiltersRequest{
		Types:       req.Types,
		Buildings:   req.Buildings,
		Floors:      req.Floors,
		MinCapacity: req.MinCapacity,
		MaxCapacity: req.MaxCapacity,
		Status:      req.Status,
		SortBy:      req.SortBy,
		SortOrder:   req.SortOrder,
		Page:        req.Page,
		Limit:       req.Limit,
	}

	// Build search filters
	searchFilters := s.buildSpaceFilters(filters)

	// Add search query if provided
	if req.Query != "" {
		searchFilters["search_query"] = req.Query
	}

	// Get spaces from repository
	spaces, total, err := s.spaceRepo.SearchSpaces(searchFilters, req.GetOffset(), req.Limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search spaces: %w", err)
	}

	return spaces, total, nil
}

// CreateSpace creates a new space
func (s *SpaceService) CreateSpace(req *dto.CreateSpaceRequest, userID uuid.UUID) (*models.Space, error) {
	// Validate user permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if !s.canManageSpaces(user) {
		return nil, errors.New("insufficient permissions to create spaces")
	}

	// Check if space with same name exists in building
	exists, err := s.spaceRepo.ExistsByNameAndBuilding(req.Name, req.Building)
	if err != nil {
		return nil, fmt.Errorf("failed to check space existence: %w", err)
	}
	if exists {
		return nil, errors.New("space with same name already exists in this building")
	}

	// Validate manager if provided
	if req.ManagerID != nil {
		manager, err := s.userRepo.GetByID(*req.ManagerID)
		if err != nil {
			return nil, fmt.Errorf("invalid manager ID: %w", err)
		}
		if !s.canBeSpaceManager(manager) {
			return nil, errors.New("specified user cannot be a space manager")
		}
	}

	// Convert equipment to JSON
	equipmentJSON, err := s.convertEquipmentToJSON(req.Equipment)
	if err != nil {
		return nil, fmt.Errorf("failed to process equipment: %w", err)
	}

	// Convert photos to JSON
	photosJSON, err := s.convertPhotosToJSON(req.Photos)
	if err != nil {
		return nil, fmt.Errorf("failed to process photos: %w", err)
	}

	// Create space model
	space := &models.Space{
		Name:               req.Name,
		Type:               models.SpaceType(req.Type),
		Capacity:           req.Capacity,
		Building:           req.Building,
		Floor:              req.Floor,
		RoomNumber:         req.RoomNumber,
		Equipment:          equipmentJSON,
		Status:             models.SpaceStatusAvailable,
		Description:        req.Description,
		Surface:            req.Surface,
		Photos:             photosJSON,
		PricePerHour:       req.PricePerHour,
		PricePerDay:        req.PricePerDay,
		PricePerMonth:      req.PricePerMonth,
		ManagerID:          req.ManagerID,
		RequiresApproval:   req.RequiresApproval,
		BookingAdvanceTime: req.BookingAdvanceTime,
		MaxBookingDuration: req.MaxBookingDuration,
	}

	// Set defaults
	if space.BookingAdvanceTime == 0 {
		space.BookingAdvanceTime = 30 // 30 minutes default
	}
	if space.MaxBookingDuration == 0 {
		space.MaxBookingDuration = 480 // 8 hours default
	}

	// Create space in repository
	createdSpace, err := s.spaceRepo.Create(space)
	if err != nil {
		return nil, fmt.Errorf("failed to create space: %w", err)
	}

	return createdSpace, nil
}

// UpdateSpace updates an existing space
func (s *SpaceService) UpdateSpace(spaceID uuid.UUID, req *dto.UpdateSpaceRequest, userID uuid.UUID) (*models.Space, error) {
	// Validate user permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if !s.canManageSpaces(user) {
		return nil, errors.New("insufficient permissions to update spaces")
	}

	// Get existing space
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Check if name change conflicts with existing space
	if req.Name != nil && *req.Name != space.Name {
		building := space.Building
		if req.Building != nil {
			building = *req.Building
		}

		exists, err := s.spaceRepo.ExistsByNameAndBuildingExcluding(*req.Name, building, spaceID)
		if err != nil {
			return nil, fmt.Errorf("failed to check space existence: %w", err)
		}
		if exists {
			return nil, errors.New("space with same name already exists in this building")
		}
	}

	// Validate manager if being changed
	if req.ManagerID != nil {
		manager, err := s.userRepo.GetByID(*req.ManagerID)
		if err != nil {
			return nil, fmt.Errorf("invalid manager ID: %w", err)
		}
		if !s.canBeSpaceManager(manager) {
			return nil, errors.New("specified user cannot be a space manager")
		}
	}

	// Update space fields
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Type != nil {
		updates["type"] = models.SpaceType(*req.Type)
	}
	if req.Capacity != nil {
		updates["capacity"] = *req.Capacity
	}
	if req.Building != nil {
		updates["building"] = *req.Building
	}
	if req.Floor != nil {
		updates["floor"] = *req.Floor
	}
	if req.RoomNumber != nil {
		updates["room_number"] = *req.RoomNumber
	}
	if req.Equipment != nil {
		equipmentJSON, err := s.convertEquipmentToJSON(req.Equipment)
		if err != nil {
			return nil, fmt.Errorf("failed to process equipment: %w", err)
		}
		updates["equipment"] = equipmentJSON
	}
	if req.Status != nil {
		updates["status"] = models.SpaceStatus(*req.Status)
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Surface != nil {
		updates["surface"] = *req.Surface
	}
	if req.Photos != nil {
		photosJSON, err := s.convertPhotosToJSON(req.Photos)
		if err != nil {
			return nil, fmt.Errorf("failed to process photos: %w", err)
		}
		updates["photos"] = photosJSON
	}
	if req.PricePerHour != nil {
		updates["price_per_hour"] = *req.PricePerHour
	}
	if req.PricePerDay != nil {
		updates["price_per_day"] = *req.PricePerDay
	}
	if req.PricePerMonth != nil {
		updates["price_per_month"] = *req.PricePerMonth
	}
	if req.ManagerID != nil {
		updates["manager_id"] = *req.ManagerID
	}
	if req.RequiresApproval != nil {
		updates["requires_approval"] = *req.RequiresApproval
	}
	if req.BookingAdvanceTime != nil {
		updates["booking_advance_time"] = *req.BookingAdvanceTime
	}
	if req.MaxBookingDuration != nil {
		updates["max_booking_duration"] = *req.MaxBookingDuration
	}

	// Update space in repository
	updatedSpace, err := s.spaceRepo.Update(spaceID, updates)
	if err != nil {
		return nil, fmt.Errorf("failed to update space: %w", err)
	}

	return updatedSpace, nil
}

// DeleteSpace soft deletes a space
func (s *SpaceService) DeleteSpace(spaceID uuid.UUID, userID uuid.UUID) error {
	// Validate user permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if !s.canManageSpaces(user) {
		return errors.New("insufficient permissions to delete spaces")
	}

	// Check if space has active reservations
	hasActiveReservations, err := s.reservationRepo.HasActiveReservationsForSpace(spaceID)
	if err != nil {
		return fmt.Errorf("failed to check active reservations: %w", err)
	}
	if hasActiveReservations {
		return errors.New("cannot delete space with active reservations")
	}

	// Delete space
	err = s.spaceRepo.Delete(spaceID)
	if err != nil {
		return fmt.Errorf("failed to delete space: %w", err)
	}

	return nil
}

// CheckAvailability checks if a space is available for a given time slot
func (s *SpaceService) CheckAvailability(req *dto.SpaceAvailabilityRequest) (*dto.SpaceAvailabilityResponse, error) {
	// Get space
	space, err := s.spaceRepo.GetByID(req.SpaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Check if space is generally available
	if !space.IsAvailable() {
		return &dto.SpaceAvailabilityResponse{
			SpaceID:       req.SpaceID,
			SpaceName:     space.Name,
			IsAvailable:   false,
			RequestedSlot: dto.TimeSlot{StartTime: req.StartTime, EndTime: req.EndTime},
			Conflicts:     []dto.ReservationConflict{},
		}, nil
	}

	// Check for reservation conflicts
	conflicts, err := s.reservationRepo.GetConflictingReservations(req.SpaceID, req.StartTime, req.EndTime)
	if err != nil {
		return nil, fmt.Errorf("failed to check conflicts: %w", err)
	}

	// Convert conflicts to DTO
	conflictDTOs := make([]dto.ReservationConflict, len(conflicts))
	for i, conflict := range conflicts {
		conflictDTOs[i] = dto.ReservationConflict{
			ReservationID: conflict.ID,
			Title:         conflict.Title,
			StartTime:     conflict.StartTime,
			EndTime:       conflict.EndTime,
			UserName:      s.getUserName(conflict.UserID),
			Status:        string(conflict.Status),
		}
	}

	isAvailable := len(conflicts) == 0

	response := &dto.SpaceAvailabilityResponse{
		SpaceID:       req.SpaceID,
		SpaceName:     space.Name,
		IsAvailable:   isAvailable,
		RequestedSlot: dto.TimeSlot{StartTime: req.StartTime, EndTime: req.EndTime},
		Conflicts:     conflictDTOs,
	}

	// If not available, suggest next available slot
	if !isAvailable {
		nextAvailable, err := s.findNextAvailableSlot(req.SpaceID, req.EndTime, req.EndTime.Sub(req.StartTime))
		if err == nil && nextAvailable != nil {
			response.NextAvailable = nextAvailable
		}

		// Add suggestions for alternative time slots
		suggestions, err := s.findAlternativeSlots(req.SpaceID, req.StartTime, req.EndTime.Sub(req.StartTime))
		if err == nil {
			response.Suggestions = suggestions
		}
	}

	return response, nil
}

// BulkUpdateStatus updates the status of multiple spaces
func (s *SpaceService) BulkUpdateStatus(req *dto.BulkSpaceStatusRequest, userID uuid.UUID) (*dto.BulkOperationResponse, error) {
	// Validate user permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if !s.canManageSpaces(user) {
		return nil, errors.New("insufficient permissions to update spaces")
	}

	response := &dto.BulkOperationResponse{
		Success:      []uuid.UUID{},
		Failed:       []dto.BulkOperationError{},
		TotalCount:   len(req.SpaceIDs),
		SuccessCount: 0,
		FailedCount:  0,
	}

	for _, spaceID := range req.SpaceIDs {
		updates := map[string]interface{}{
			"status": models.SpaceStatus(req.Status),
		}

		_, err := s.spaceRepo.Update(spaceID, updates)
		if err != nil {
			response.Failed = append(response.Failed, dto.BulkOperationError{
				SpaceID: spaceID,
				Error:   err.Error(),
			})
			response.FailedCount++
		} else {
			response.Success = append(response.Success, spaceID)
			response.SuccessCount++
		}
	}

	return response, nil
}

// GetSpaceOptions returns available options for space creation/editing
func (s *SpaceService) GetSpaceOptions() (*dto.SpaceOptionsResponse, error) {
	// Get available buildings
	buildings, err := s.spaceRepo.GetDistinctBuildings()
	if err != nil {
		return nil, fmt.Errorf("failed to get buildings: %w", err)
	}

	// Get available floors
	floors, err := s.spaceRepo.GetDistinctFloors()
	if err != nil {
		return nil, fmt.Errorf("failed to get floors: %w", err)
	}

	// Get available equipment options
	equipment, err := s.spaceRepo.GetDistinctEquipment()
	if err != nil {
		return nil, fmt.Errorf("failed to get equipment: %w", err)
	}

	// Get potential managers (users with admin/manager roles)

	response := &dto.SpaceOptionsResponse{
		Types: []dto.SpaceTypeOption{
			{Value: "meeting_room", Label: "Meeting Room", Description: "Standard meeting room for team discussions"},
			{Value: "office", Label: "Office", Description: "Private office space"},
			{Value: "auditorium", Label: "Auditorium", Description: "Large presentation space"},
			{Value: "open_space", Label: "Open Space", Description: "Collaborative open area"},
			{Value: "hot_desk", Label: "Hot Desk", Description: "Flexible desk space"},
			{Value: "conference_room", Label: "Conference Room", Description: "Large conference room for formal meetings"},
		},
		Buildings: buildings,
		Floors:    floors,
		Statuses: []dto.SpaceStatusOption{
			{Value: "available", Label: "Available", Description: "Space is available for booking"},
			{Value: "maintenance", Label: "Maintenance", Description: "Space is under maintenance"},
			{Value: "out_of_service", Label: "Out of Service", Description: "Space is temporarily unavailable"},
			{Value: "reserved", Label: "Reserved", Description: "Space is reserved"},
		},
		Equipment: equipment,
	}

	return response, nil
}

// GetSpaceAnalytics returns analytics data for a space
func (s *SpaceService) GetSpaceAnalytics(spaceID uuid.UUID, period string) (*dto.SpaceAnalyticsResponse, error) {
	// Get space
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	response := &dto.SpaceAnalyticsResponse{
		SpaceID:   spaceID,
		SpaceName: space.Name,
		Period:    period,
		// Analytics data would be populated from the repository response
		// This is a placeholder implementation
	}

	return response, nil
}

// GetBuildings returns list of all buildings
func (s *SpaceService) GetBuildings() ([]string, error) {
	buildings, err := s.spaceRepo.GetDistinctBuildings()
	if err != nil {
		return nil, fmt.Errorf("failed to get buildings: %w", err)
	}

	return buildings, nil
}

// Helper methods

// buildSpaceFilters converts DTO filters to repository filters
func (s *SpaceService) buildSpaceFilters(req *dto.SpaceFiltersRequest) map[string]interface{} {
	filters := make(map[string]interface{})

	if len(req.Types) > 0 {
		filters["types"] = req.Types
	}
	if len(req.Buildings) > 0 {
		filters["buildings"] = req.Buildings
	}
	if len(req.Floors) > 0 {
		filters["floors"] = req.Floors
	}
	if req.MinCapacity != nil {
		filters["min_capacity"] = *req.MinCapacity
	}
	if req.MaxCapacity != nil {
		filters["max_capacity"] = *req.MaxCapacity
	}
	if len(req.Status) > 0 {
		filters["status"] = req.Status
	}
	if len(req.RequiredEquipment) > 0 {
		filters["required_equipment"] = req.RequiredEquipment
	}
	if req.RequiresApproval != nil {
		filters["requires_approval"] = *req.RequiresApproval
	}
	if req.MaxPricePerHour != nil {
		filters["max_price_per_hour"] = *req.MaxPricePerHour
	}
	if req.MaxPricePerDay != nil {
		filters["max_price_per_day"] = *req.MaxPricePerDay
	}
	if req.MaxPricePerMonth != nil {
		filters["max_price_per_month"] = *req.MaxPricePerMonth
	}
	if req.AvailableStartTime != nil && req.AvailableEndTime != nil {
		filters["available_start_time"] = *req.AvailableStartTime
		filters["available_end_time"] = *req.AvailableEndTime
	}

	// Add sorting
	if req.SortBy != "" {
		filters["sort_by"] = req.SortBy
	}
	if req.SortOrder != "" {
		filters["sort_order"] = req.SortOrder
	}

	return filters
}

// convertEquipmentToJSON converts equipment slice to JSON
func (s *SpaceService) convertEquipmentToJSON(equipment []dto.Equipment) (datatypes.JSON, error) {
	if len(equipment) == 0 {
		return nil, nil
	}

	jsonData, err := json.Marshal(equipment)
	if err != nil {
		return nil, err
	}

	return datatypes.JSON(jsonData), nil
}

// convertPhotosToJSON converts photos slice to JSON
func (s *SpaceService) convertPhotosToJSON(photos []string) (datatypes.JSON, error) {
	if len(photos) == 0 {
		return nil, nil
	}

	jsonData, err := json.Marshal(photos)
	if err != nil {
		return nil, err
	}

	return datatypes.JSON(jsonData), nil
}

// canManageSpaces checks if user can manage spaces
func (s *SpaceService) canManageSpaces(user *models.User) bool {
	// Check if user has admin or manager role
	return user.Role == models.RoleAdmin || user.Role == models.RoleManager
}

// canBeSpaceManager checks if user can be a space manager
func (s *SpaceService) canBeSpaceManager(user *models.User) bool {
	// Check if user has appropriate role to be a space manager
	return user.Role == models.RoleAdmin || user.Role == models.RoleManager
}

// getUserName gets the full name of a user by ID
func (s *SpaceService) getUserName(userID uuid.UUID) string {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return "Unknown User"
	}
	return user.FirstName + " " + user.LastName
}

// findNextAvailableSlot finds the next available time slot for a space
func (s *SpaceService) findNextAvailableSlot(spaceID uuid.UUID, startTime time.Time, duration time.Duration) (*dto.TimeSlot, error) {
	// This would implement logic to find the next available slot
	// For now, returning nil as placeholder
	return nil, nil
}

// findAlternativeSlots finds alternative available time slots
func (s *SpaceService) findAlternativeSlots(spaceID uuid.UUID, preferredStart time.Time, duration time.Duration) ([]dto.AvailabilitySlot, error) {
	// This would implement logic to find alternative slots
	// For now, returning empty slice as placeholder
	return []dto.AvailabilitySlot{}, nil
}
