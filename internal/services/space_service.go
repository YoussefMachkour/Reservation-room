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

// SpaceService handles all space business logic
type SpaceService struct {
	spaceRepo       interfaces.SpaceRepositoryInterface
	reservationRepo interfaces.ReservationRepositoryInterface
	userRepo        interfaces.UserRepositoryInterface
}

// NewSpaceService creates a new space service
func NewSpaceService(
	spaceRepo interfaces.SpaceRepositoryInterface,
	reservationRepo interfaces.ReservationRepositoryInterface,
	userRepo interfaces.UserRepositoryInterface,
) *SpaceService {
	return &SpaceService{
		spaceRepo:       spaceRepo,
		reservationRepo: reservationRepo,
		userRepo:        userRepo,
	}
}

// ========================================
// BASIC CRUD OPERATIONS
// ========================================

// CreateSpace creates a new space
func (s *SpaceService) CreateSpace(req *dto.CreateSpaceRequest, userID uuid.UUID) (*models.Space, error) {
	// Check if user has permission to create spaces
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsAdmin() && !user.IsManager() {
		return nil, errors.New("only admins and managers can create spaces")
	}

	// Validate business rules
	if req.Name == "" {
		return nil, errors.New("space name is required")
	}
	if req.Building == "" {
		return nil, errors.New("building is required")
	}
	if req.Capacity <= 0 {
		return nil, errors.New("capacity must be greater than 0")
	}

	// Check if space name already exists in the same building
	exists, err := s.spaceRepo.ExistsByNameAndBuilding(req.Name, req.Building)
	if err != nil {
		return nil, fmt.Errorf("failed to check space existence: %w", err)
	}
	if exists {
		return nil, errors.New("space with this name already exists in the building")
	}

	// Validate manager if provided
	var managerID *uuid.UUID
	if req.ManagerID != nil {
		manager, err := s.userRepo.GetByID(*req.ManagerID)
		if err != nil {
			return nil, fmt.Errorf("failed to get manager: %w", err)
		}
		if !manager.IsManager() && !manager.IsAdmin() {
			return nil, errors.New("assigned manager must have manager or admin role")
		}
		managerID = req.ManagerID
	}

	// Handle equipment JSON
	var equipmentJSON datatypes.JSON
	if len(req.Equipment) > 0 {
		equipmentBytes, err := json.Marshal(req.Equipment)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize equipment: %w", err)
		}
		equipmentJSON = datatypes.JSON(equipmentBytes)
	}

	// Handle photos JSON
	var photosJSON datatypes.JSON
	if len(req.Photos) > 0 {
		photosBytes, err := json.Marshal(req.Photos)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize photos: %w", err)
		}
		photosJSON = datatypes.JSON(photosBytes)
	}

	// Set default status if not provided
	status := "available"

	// Set default values for booking settings
	bookingAdvanceTime := req.BookingAdvanceTime
	if bookingAdvanceTime == 0 {
		bookingAdvanceTime = 30 // 30 minutes default
	}

	maxBookingDuration := req.MaxBookingDuration
	if maxBookingDuration == 0 {
		maxBookingDuration = 480 // 8 hours default
	}

	// Create space
	space := &models.Space{
		Name:               req.Name,
		Type:               models.SpaceType(req.Type),
		Capacity:           req.Capacity,
		Building:           req.Building,
		Floor:              req.Floor,
		RoomNumber:         req.RoomNumber,
		Equipment:          equipmentJSON,
		Status:             models.SpaceStatus(status),
		Description:        req.Description,
		Surface:            req.Surface,
		Photos:             photosJSON,
		PricePerHour:       req.PricePerHour,
		PricePerDay:        req.PricePerDay,
		PricePerMonth:      req.PricePerMonth,
		ManagerID:          managerID,
		RequiresApproval:   req.RequiresApproval,
		BookingAdvanceTime: bookingAdvanceTime,
		MaxBookingDuration: maxBookingDuration,
	}

	createdSpace, err := s.spaceRepo.Create(space)
	if err != nil {
		return nil, fmt.Errorf("failed to create space: %w", err)
	}

	return createdSpace, nil
}

// GetSpaceByID retrieves a space by ID
func (s *SpaceService) GetSpaceByID(spaceID uuid.UUID) (*models.Space, error) {
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	return space, nil
}

// UpdateSpace updates an existing space
func (s *SpaceService) UpdateSpace(spaceID uuid.UUID, req *dto.UpdateSpaceRequest, userID uuid.UUID) (*models.Space, error) {
	// Get existing space
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Check permissions
	if !s.canUserModifySpace(space, userID) {
		return nil, errors.New("access denied")
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Name != nil {
		// Validate name is not empty
		if *req.Name == "" {
			return nil, errors.New("space name cannot be empty")
		}

		// Check if new name conflicts with existing space
		if *req.Name != space.Name {
			building := space.Building
			if req.Building != nil {
				building = *req.Building
			}

			exists, err := s.spaceRepo.ExistsByNameAndBuildingExcluding(*req.Name, building, spaceID)
			if err != nil {
				return nil, fmt.Errorf("failed to check space existence: %w", err)
			}
			if exists {
				return nil, errors.New("space with this name already exists in the building")
			}
		}
		updates["name"] = *req.Name
	}

	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Capacity != nil {
		if *req.Capacity <= 0 {
			return nil, errors.New("capacity must be greater than 0")
		}
		updates["capacity"] = *req.Capacity
	}
	if req.Building != nil {
		if *req.Building == "" {
			return nil, errors.New("building cannot be empty")
		}
		updates["building"] = *req.Building
	}
	if req.Floor != nil {
		updates["floor"] = *req.Floor
	}
	if req.RoomNumber != nil {
		if *req.RoomNumber == "" {
			return nil, errors.New("room number cannot be empty")
		}
		updates["room_number"] = *req.RoomNumber
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Surface != nil {
		updates["surface"] = *req.Surface
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
	if req.RequiresApproval != nil {
		updates["requires_approval"] = *req.RequiresApproval
	}
	if req.BookingAdvanceTime != nil {
		updates["booking_advance_time"] = *req.BookingAdvanceTime
	}
	if req.MaxBookingDuration != nil {
		if *req.MaxBookingDuration < 30 {
			return nil, errors.New("maximum booking duration must be at least 30 minutes")
		}
		updates["max_booking_duration"] = *req.MaxBookingDuration
	}

	// Handle manager assignment
	if req.ManagerID != nil {
		if *req.ManagerID != uuid.Nil {
			manager, err := s.userRepo.GetByID(*req.ManagerID)
			if err != nil {
				return nil, fmt.Errorf("failed to get manager: %w", err)
			}
			if !manager.IsManager() && !manager.IsAdmin() {
				return nil, errors.New("assigned manager must have manager or admin role")
			}
		}
		updates["manager_id"] = req.ManagerID
	}

	// Handle equipment updates
	if req.Equipment != nil {
		if len(req.Equipment) > 0 {
			equipmentBytes, err := json.Marshal(req.Equipment)
			if err != nil {
				return nil, fmt.Errorf("failed to serialize equipment: %w", err)
			}
			updates["equipment"] = datatypes.JSON(equipmentBytes)
		} else {
			updates["equipment"] = nil
		}
	}

	// Handle photos updates
	if req.Photos != nil {
		if len(req.Photos) > 0 {
			photosBytes, err := json.Marshal(req.Photos)
			if err != nil {
				return nil, fmt.Errorf("failed to serialize photos: %w", err)
			}
			updates["photos"] = datatypes.JSON(photosBytes)
		} else {
			updates["photos"] = nil
		}
	}

	updatedSpace, err := s.spaceRepo.Update(spaceID, updates)
	if err != nil {
		return nil, fmt.Errorf("failed to update space: %w", err)
	}

	return updatedSpace, nil
}

// DeleteSpace soft deletes a space
func (s *SpaceService) DeleteSpace(spaceID, userID uuid.UUID) error {
	// Get the space
	_, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return fmt.Errorf("failed to get space: %w", err)
	}

	// Check permissions (only admins can delete spaces)
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsAdmin() {
		return errors.New("only administrators can delete spaces")
	}

	// Check if space has active reservations (using method from reservation repo interface)
	hasActive, err := s.reservationRepo.HasActiveReservationsForSpace(spaceID)
	if err != nil {
		// If method doesn't exist, try alternative approach
		conflicts, conflictErr := s.reservationRepo.GetConflictingReservations(spaceID, time.Now(), time.Now().Add(24*time.Hour))
		if conflictErr != nil {
			return fmt.Errorf("failed to check active reservations: %w", err)
		}
		hasActive = len(conflicts) > 0
	}

	if hasActive {
		return errors.New("cannot delete space with active reservations")
	}

	// Delete the space
	err = s.spaceRepo.Delete(spaceID)
	if err != nil {
		return fmt.Errorf("failed to delete space: %w", err)
	}

	return nil
}

// ========================================
// LISTING AND SEARCH OPERATIONS
// ========================================

// GetAllSpaces retrieves all spaces with pagination
func (s *SpaceService) GetAllSpaces(offset, limit int) ([]*models.Space, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.GetAll(offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces: %w", err)
	}

	return spaces, total, nil
}

// SearchSpaces searches spaces with filters
func (s *SpaceService) SearchSpaces(filters interfaces.SpaceFilters, offset, limit int) ([]*models.Space, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.SearchSpaces(filters, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search spaces: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesByBuilding retrieves spaces in a specific building
func (s *SpaceService) GetSpacesByBuilding(building string, offset, limit int) ([]*models.Space, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.GetSpacesByBuilding(building, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by building: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesByType retrieves spaces of a specific type
func (s *SpaceService) GetSpacesByType(spaceType string, offset, limit int) ([]*models.Space, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.GetSpacesByType(spaceType, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by type: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesByStatus retrieves spaces with a specific status
func (s *SpaceService) GetSpacesByStatus(status string, offset, limit int, userID uuid.UUID) ([]*models.Space, int64, error) {
	// Check permissions - only admins and managers can filter by status
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsAdmin() && !user.IsManager() {
		return nil, 0, errors.New("access denied")
	}

	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.GetSpacesByStatus(status, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by status: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesByCapacityRange retrieves spaces within a capacity range
func (s *SpaceService) GetSpacesByCapacityRange(minCapacity, maxCapacity int, offset, limit int) ([]*models.Space, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.GetSpacesByCapacityRange(minCapacity, maxCapacity, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by capacity: %w", err)
	}

	return spaces, total, nil
}

// ========================================
// AVAILABILITY OPERATIONS
// ========================================

// GetAvailableSpaces retrieves spaces available during a specific time period
func (s *SpaceService) GetAvailableSpaces(startTime, endTime time.Time, offset, limit int) ([]*models.Space, int64, error) {
	// Validate time range
	if startTime.After(endTime) {
		return nil, 0, errors.New("start time must be before end time")
	}

	if startTime.Before(time.Now()) {
		return nil, 0, errors.New("cannot search for availability in the past")
	}

	if limit <= 0 {
		limit = 20
	}

	// Use space repo method if available, otherwise implement logic here
	spaces, total, err := s.spaceRepo.GetAvailableSpaces(startTime, endTime, offset, limit)
	if err != nil {
		// Fallback: get all spaces and filter manually
		allSpaces, _, err := s.spaceRepo.GetAll(0, 1000) // Get reasonable amount
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get spaces: %w", err)
		}

		var availableSpaces []*models.Space
		for _, space := range allSpaces {
			if space.Status == models.SpaceStatusAvailable {
				available, err := s.reservationRepo.CheckTimeSlotAvailability(space.ID, startTime, endTime, nil)
				if err == nil && available {
					availableSpaces = append(availableSpaces, space)
				}
			}
		}

		// Apply pagination manually
		total = int64(len(availableSpaces))
		start := offset
		end := offset + limit
		if start > len(availableSpaces) {
			return []*models.Space{}, total, nil
		}
		if end > len(availableSpaces) {
			end = len(availableSpaces)
		}

		return availableSpaces[start:end], total, nil
	}

	return spaces, total, nil
}

// CheckSpaceAvailability checks if a space is available during a time period
func (s *SpaceService) CheckSpaceAvailability(spaceID uuid.UUID, startTime, endTime time.Time) (*dto.AvailabilityResponse, error) {
	// Validate time range
	if startTime.After(endTime) {
		return nil, errors.New("start time must be before end time")
	}

	// Get space info
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Check availability using reservation repo (consistent with ReservationService)
	available, err := s.reservationRepo.CheckTimeSlotAvailability(spaceID, startTime, endTime, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check availability: %w", err)
	}

	response := &dto.AvailabilityResponse{
		SpaceID:     spaceID,
		SpaceName:   space.Name,
		IsAvailable: available,
		RequestedSlot: dto.TimeSlot{
			StartTime: startTime,
			EndTime:   endTime,
		},
	}

	// Get conflicts if not available
	if !available {
		conflicts, err := s.reservationRepo.GetConflictingReservations(spaceID, startTime, endTime)
		if err == nil && len(conflicts) > 0 {
			for _, conflict := range conflicts {
				userName := conflict.User.GetFullName()
				if userName == " " {
					userName = conflict.User.Email
				}
				response.Conflicts = append(response.Conflicts, dto.ReservationConflict{
					ReservationID: conflict.ID,
					Title:         conflict.Title,
					StartTime:     conflict.StartTime,
					EndTime:       conflict.EndTime,
					UserName:      userName,
					Status:        string(conflict.Status),
				})
			}
		}

		// Generate next available slot suggestion
		nextAvailable := s.findNextAvailableSlot(spaceID, endTime, endTime.Sub(startTime))
		if nextAvailable != nil {
			response.NextAvailable = nextAvailable
		}
	}

	return response, nil
}

// ========================================
// MANAGER OPERATIONS
// ========================================

// GetSpacesByManager retrieves spaces managed by a specific manager
func (s *SpaceService) GetSpacesByManager(managerID uuid.UUID, offset, limit int, userID uuid.UUID) ([]*models.Space, int64, error) {
	// Check permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	// Users can only view their own managed spaces (if they're managers) or admins can view any
	if !user.IsAdmin() && userID != managerID {
		return nil, 0, errors.New("access denied")
	}

	if limit <= 0 {
		limit = 20
	}

	spaces, total, err := s.spaceRepo.GetSpacesByManager(managerID, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by manager: %w", err)
	}

	return spaces, total, nil
}

// AssignManager assigns a manager to a space
func (s *SpaceService) AssignManager(spaceID, managerID, userID uuid.UUID) error {
	// Check permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsAdmin() {
		return errors.New("only administrators can assign managers")
	}

	// Validate manager
	manager, err := s.userRepo.GetByID(managerID)
	if err != nil {
		return fmt.Errorf("failed to get manager: %w", err)
	}

	if !manager.IsManager() && !manager.IsAdmin() {
		return errors.New("assigned user must have manager or admin role")
	}

	// Update space
	updates := map[string]interface{}{
		"manager_id": managerID,
	}

	_, err = s.spaceRepo.Update(spaceID, updates)
	if err != nil {
		return fmt.Errorf("failed to assign manager: %w", err)
	}

	return nil
}

// UnassignManager removes a manager from a space
func (s *SpaceService) UnassignManager(spaceID, userID uuid.UUID) error {
	// Check permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsAdmin() {
		return errors.New("only administrators can unassign managers")
	}

	// Update space
	updates := map[string]interface{}{
		"manager_id": nil,
	}

	_, err = s.spaceRepo.Update(spaceID, updates)
	if err != nil {
		return fmt.Errorf("failed to unassign manager: %w", err)
	}

	return nil
}

// ========================================
// UTILITY OPERATIONS
// ========================================

// GetDistinctBuildings retrieves all unique building names
func (s *SpaceService) GetDistinctBuildings() ([]string, error) {
	buildings, err := s.spaceRepo.GetDistinctBuildings()
	if err != nil {
		return nil, fmt.Errorf("failed to get buildings: %w", err)
	}

	return buildings, nil
}

// GetDistinctFloors retrieves all unique floor numbers
func (s *SpaceService) GetDistinctFloors() ([]int, error) {
	floors, err := s.spaceRepo.GetDistinctFloors()
	if err != nil {
		return nil, fmt.Errorf("failed to get floors: %w", err)
	}

	return floors, nil
}

// GetSpaceOptions returns available options for space creation/editing
func (s *SpaceService) GetSpaceOptions() (*dto.SpaceOptionsResponse, error) {
	// Get buildings and floors
	buildings, err := s.GetDistinctBuildings()
	if err != nil {
		return nil, fmt.Errorf("failed to get buildings: %w", err)
	}

	floors, err := s.GetDistinctFloors()
	if err != nil {
		return nil, fmt.Errorf("failed to get floors: %w", err)
	}

	// Define space types
	spaceTypes := []dto.SpaceTypeOption{
		{Value: "meeting_room", Label: "Meeting Room", Description: "Small to medium rooms for meetings"},
		{Value: "conference_room", Label: "Conference Room", Description: "Large rooms for conferences"},
		{Value: "office", Label: "Office", Description: "Individual or shared office spaces"},
		{Value: "auditorium", Label: "Auditorium", Description: "Large presentation spaces"},
		{Value: "open_space", Label: "Open Space", Description: "Collaborative open areas"},
		{Value: "hot_desk", Label: "Hot Desk", Description: "Flexible workstations"},
	}

	// Define statuses
	statuses := []dto.SpaceStatusOption{
		{Value: "available", Label: "Available", Description: "Space is available for booking"},
		{Value: "maintenance", Label: "Maintenance", Description: "Space is under maintenance"},
		{Value: "out_of_service", Label: "Out of Service", Description: "Space is temporarily unavailable"},
		{Value: "reserved", Label: "Reserved", Description: "Space is reserved for special use"},
	}

	return &dto.SpaceOptionsResponse{
		Types:     spaceTypes,
		Buildings: buildings,
		Floors:    floors,
		Statuses:  statuses,
	}, nil
}

// ========================================
// STATISTICS OPERATIONS
// ========================================

// GetSpaceCount gets total space count
func (s *SpaceService) GetSpaceCount() (int64, error) {
	count, err := s.spaceRepo.CountSpaces()
	if err != nil {
		return 0, fmt.Errorf("failed to count spaces: %w", err)
	}

	return count, nil
}

// GetSpaceCountByStatus gets space count by status
func (s *SpaceService) GetSpaceCountByStatus(status string, userID uuid.UUID) (int64, error) {
	// Check permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return 0, fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsAdmin() && !user.IsManager() {
		return 0, errors.New("access denied")
	}

	count, err := s.spaceRepo.CountSpacesByStatus(status)
	if err != nil {
		return 0, fmt.Errorf("failed to count spaces by status: %w", err)
	}

	return count, nil
}

// GetSpaceCountByBuilding gets space count by building
func (s *SpaceService) GetSpaceCountByBuilding(building string) (int64, error) {
	count, err := s.spaceRepo.CountSpacesByBuilding(building)
	if err != nil {
		return 0, fmt.Errorf("failed to count spaces by building: %w", err)
	}

	return count, nil
}

// GetSpaceReservationCount gets total reservation count for a space
func (s *SpaceService) GetSpaceReservationCount(spaceID uuid.UUID, userID uuid.UUID) (int64, error) {
	// Check if user can view space stats
	if !s.canUserViewSpaceStats(spaceID, userID) {
		return 0, errors.New("access denied")
	}

	count, err := s.reservationRepo.CountSpaceReservations(spaceID)
	if err != nil {
		return 0, fmt.Errorf("failed to count space reservations: %w", err)
	}

	return count, nil
}

// ========================================
// HELPER METHODS
// ========================================

// canUserModifySpace checks if user can modify a space
func (s *SpaceService) canUserModifySpace(space *models.Space, userID uuid.UUID) bool {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	// Admins can modify any space
	if user.IsAdmin() {
		return true
	}

	// Managers can modify spaces they manage
	if user.IsManager() && space.ManagerID != nil && *space.ManagerID == userID {
		return true
	}

	return false
}

// canUserViewSpaceStats checks if user can view space statistics
func (s *SpaceService) canUserViewSpaceStats(spaceID uuid.UUID, userID uuid.UUID) bool {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	// Admins can view all stats
	if user.IsAdmin() {
		return true
	}

	// Managers can view stats for spaces they manage
	if user.IsManager() {
		space, err := s.spaceRepo.GetByID(spaceID)
		if err != nil {
			return false
		}
		return space.ManagerID != nil && *space.ManagerID == userID
	}

	return false
}

// findNextAvailableSlot finds the next available time slot for a space
func (s *SpaceService) findNextAvailableSlot(spaceID uuid.UUID, startSearchTime time.Time, duration time.Duration) *dto.TimeSlot {
	// Simple implementation: check the next 24 hours in 1-hour increments
	for i := 0; i < 24; i++ {
		candidateStart := startSearchTime.Add(time.Duration(i) * time.Hour)
		candidateEnd := candidateStart.Add(duration)

		// Use reservation repo method for consistency
		available, err := s.reservationRepo.CheckTimeSlotAvailability(spaceID, candidateStart, candidateEnd, nil)
		if err == nil && available {
			return &dto.TimeSlot{
				StartTime: candidateStart,
				EndTime:   candidateEnd,
			}
		}
	}

	return nil
}
