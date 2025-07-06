// internal/services/reservation_service.go
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

// ReservationService handles all reservation business logic
type ReservationService struct {
	reservationRepo interfaces.ReservationRepositoryInterface
	spaceRepo       interfaces.SpaceRepositoryInterface
	userRepo        interfaces.UserRepositoryInterface
}

// NewReservationService creates a new reservation service
func NewReservationService(
	reservationRepo interfaces.ReservationRepositoryInterface,
	spaceRepo interfaces.SpaceRepositoryInterface,
	userRepo interfaces.UserRepositoryInterface,
) *ReservationService {
	return &ReservationService{
		reservationRepo: reservationRepo,
		spaceRepo:       spaceRepo,
		userRepo:        userRepo,
	}
}

// ========================================
// BASIC CRUD OPERATIONS
// ========================================

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(req *dto.CreateReservationRequest, userID uuid.UUID) (*models.Reservation, error) {
	// Validate the request
	if err := req.Validate(); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Get the space to validate capacity and requirements
	space, err := s.spaceRepo.GetByID(req.SpaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Basic validations
	if !space.IsAvailable() {
		return nil, errors.New("space is not available for booking")
	}

	if req.ParticipantCount > space.Capacity {
		return nil, fmt.Errorf("participant count (%d) exceeds space capacity (%d)", req.ParticipantCount, space.Capacity)
	}

	// Check for time conflicts
	available, err := s.reservationRepo.CheckTimeSlotAvailability(req.SpaceID, req.StartTime, req.EndTime, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check availability: %w", err)
	}
	if !available {
		return nil, errors.New("time slot is not available")
	}

	// Validate booking time
	if req.StartTime.Before(time.Now()) {
		return nil, errors.New("cannot book in the past")
	}

	if req.EndTime.Before(req.StartTime) {
		return nil, errors.New("end time must be after start time")
	}

	// Check advance booking time
	if space.BookingAdvanceTime > 0 {
		minBookingTime := time.Now().Add(time.Duration(space.BookingAdvanceTime) * time.Minute)
		if req.StartTime.Before(minBookingTime) {
			return nil, fmt.Errorf("reservations must be made at least %d minutes in advance", space.BookingAdvanceTime)
		}
	}

	// Check maximum duration
	if space.MaxBookingDuration > 0 {
		maxDuration := time.Duration(space.MaxBookingDuration) * time.Minute
		if req.EndTime.Sub(req.StartTime) > maxDuration {
			return nil, fmt.Errorf("booking duration cannot exceed %d minutes", space.MaxBookingDuration)
		}
	}

	// Determine status
	status := models.StatusConfirmed
	if space.RequiresApproval {
		status = models.StatusPending
	}

	// Create reservation
	reservation := &models.Reservation{
		UserID:           userID,
		SpaceID:          req.SpaceID,
		StartTime:        req.StartTime,
		EndTime:          req.EndTime,
		ParticipantCount: req.ParticipantCount,
		Title:            req.Title,
		Description:      req.Description,
		Status:           status,
		IsRecurring:      req.IsRecurring,
	}

	// Handle recurrence if needed
	if req.IsRecurring && req.RecurrencePattern != nil {
		patternBytes, err := json.Marshal(req.RecurrencePattern)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize recurrence pattern: %w", err)
		}
		reservation.RecurrencePattern = datatypes.JSON(patternBytes)
	}

	createdReservation, err := s.reservationRepo.Create(reservation)
	if err != nil {
		return nil, fmt.Errorf("failed to create reservation: %w", err)
	}

	// Create recurring instances if needed
	if req.IsRecurring && req.RecurrencePattern != nil {
		s.createRecurringInstances(createdReservation, req.RecurrencePattern)
	}

	return createdReservation, nil
}

// GetReservationByID retrieves a reservation by ID
func (s *ReservationService) GetReservationByID(reservationID, userID uuid.UUID) (*models.Reservation, error) {
	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reservation: %w", err)
	}

	// Check permissions
	if !s.canUserAccessReservation(reservation, userID) {
		return nil, errors.New("access denied")
	}

	return reservation, nil
}

// UpdateReservation updates a reservation
func (s *ReservationService) UpdateReservation(reservationID uuid.UUID, req *dto.UpdateReservationRequest, userID uuid.UUID) (*models.Reservation, error) {
	// Get existing reservation
	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reservation: %w", err)
	}

	// Check permissions
	if !s.canUserModifyReservation(reservation, userID) {
		return nil, errors.New("access denied")
	}

	// Check if can be modified
	if !reservation.CanBeModified() {
		return nil, errors.New("reservation cannot be modified")
	}

	// Build updates
	updates := make(map[string]interface{})
	if req.StartTime != nil {
		updates["start_time"] = *req.StartTime
	}
	if req.EndTime != nil {
		updates["end_time"] = *req.EndTime
	}
	if req.ParticipantCount != nil {
		updates["participant_count"] = *req.ParticipantCount
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	// Validate time changes
	if req.StartTime != nil || req.EndTime != nil {
		startTime := reservation.StartTime
		endTime := reservation.EndTime
		if req.StartTime != nil {
			startTime = *req.StartTime
		}
		if req.EndTime != nil {
			endTime = *req.EndTime
		}

		available, err := s.reservationRepo.CheckTimeSlotAvailability(reservation.SpaceID, startTime, endTime, &reservationID)
		if err != nil {
			return nil, fmt.Errorf("failed to check availability: %w", err)
		}
		if !available {
			return nil, errors.New("time slot is not available")
		}
	}

	// Validate capacity changes
	if req.ParticipantCount != nil {
		space, err := s.spaceRepo.GetByID(reservation.SpaceID)
		if err != nil {
			return nil, fmt.Errorf("failed to get space: %w", err)
		}
		if *req.ParticipantCount > space.Capacity {
			return nil, fmt.Errorf("participant count (%d) exceeds space capacity (%d)", *req.ParticipantCount, space.Capacity)
		}
	}

	updatedReservation, err := s.reservationRepo.Update(reservationID, updates)
	if err != nil {
		return nil, fmt.Errorf("failed to update reservation: %w", err)
	}

	return updatedReservation, nil
}

// CancelReservation cancels a reservation
func (s *ReservationService) CancelReservation(reservationID uuid.UUID, reason string, userID uuid.UUID) error {
	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservation: %w", err)
	}

	if !s.canUserModifyReservation(reservation, userID) {
		return errors.New("access denied")
	}

	if !reservation.CanBeCancelled() {
		return errors.New("reservation cannot be cancelled")
	}

	updates := map[string]interface{}{
		"status":              models.StatusCancelled,
		"cancellation_reason": reason,
	}

	_, err = s.reservationRepo.Update(reservationID, updates)
	if err != nil {
		return fmt.Errorf("failed to cancel reservation: %w", err)
	}

	return nil
}

// DeleteReservation deletes a reservation (admin only)
func (s *ReservationService) DeleteReservation(reservationID, userID uuid.UUID) error {
	// Check if user is admin
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user.Role != models.RoleAdmin {
		return errors.New("only administrators can delete reservations")
	}

	return s.reservationRepo.Delete(reservationID)
}

// ========================================
// USER OPERATIONS
// ========================================

// GetUserReservations gets all reservations for a user
func (s *ReservationService) GetUserReservations(userID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	reservations, total, err := s.reservationRepo.GetUserReservations(userID, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user reservations: %w", err)
	}

	return reservations, total, nil
}

// GetUserUpcomingReservations gets upcoming reservations for a user
func (s *ReservationService) GetUserUpcomingReservations(userID uuid.UUID, limit int) ([]*models.Reservation, error) {
	if limit <= 0 {
		limit = 10
	}

	reservations, err := s.reservationRepo.GetUserUpcomingReservations(userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming reservations: %w", err)
	}

	return reservations, nil
}

// GetUserPastReservations gets past reservations for a user
func (s *ReservationService) GetUserPastReservations(userID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	if limit <= 0 {
		limit = 20
	}

	reservations, total, err := s.reservationRepo.GetUserPastReservations(userID, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get past reservations: %w", err)
	}

	return reservations, total, nil
}

// GetUserActiveReservation gets the current active reservation for a user
func (s *ReservationService) GetUserActiveReservation(userID uuid.UUID) (*models.Reservation, error) {
	reservation, err := s.reservationRepo.GetUserActiveReservation(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get active reservation: %w", err)
	}

	return reservation, nil
}

// ========================================
// SPACE OPERATIONS
// ========================================

// GetSpaceReservations gets reservations for a space
func (s *ReservationService) GetSpaceReservations(spaceID uuid.UUID, startDate, endDate time.Time, userID uuid.UUID) ([]*models.Reservation, error) {
	// Basic permission check - everyone can view space schedules
	reservations, _, err := s.reservationRepo.GetSpaceReservationsByDateRange(spaceID, startDate, endDate, 0, 100)
	if err != nil {
		return nil, fmt.Errorf("failed to get space reservations: %w", err)
	}

	return reservations, nil
}

// CheckSpaceAvailability checks if a space is available
func (s *ReservationService) CheckSpaceAvailability(spaceID uuid.UUID, startTime, endTime time.Time) (*dto.AvailabilityResponse, error) {
	// Get space info
	space, err := s.spaceRepo.GetByID(spaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Check availability
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
		conflictReservations, err := s.reservationRepo.GetConflictingReservations(spaceID, startTime, endTime)
		if err == nil {
			for _, conflict := range conflictReservations {
				userName := conflict.User.FirstName + " " + conflict.User.LastName
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
	}

	return response, nil
}

// ========================================
// APPROVAL OPERATIONS
// ========================================

// GetPendingApprovals gets reservations needing approval
func (s *ReservationService) GetPendingApprovals(managerID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	// Check if user is manager/admin
	user, err := s.userRepo.GetByID(managerID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	if user.Role != models.RoleManager && user.Role != models.RoleAdmin {
		return nil, 0, errors.New("only managers and admins can view pending approvals")
	}

	if limit <= 0 {
		limit = 20
	}

	reservations, total, err := s.reservationRepo.GetPendingApprovals(managerID, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get pending approvals: %w", err)
	}

	return reservations, total, nil
}

// ApproveReservation approves a reservation
func (s *ReservationService) ApproveReservation(reservationID uuid.UUID, approverID uuid.UUID, comments string) error {
	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservation: %w", err)
	}

	if reservation.Status != models.StatusPending {
		return errors.New("reservation is not pending approval")
	}

	if !s.canUserApproveReservation(reservation, approverID) {
		return errors.New("access denied")
	}

	err = s.reservationRepo.ApproveReservation(reservationID, approverID, comments)
	if err != nil {
		return fmt.Errorf("failed to approve reservation: %w", err)
	}

	return nil
}

// RejectReservation rejects a reservation
func (s *ReservationService) RejectReservation(reservationID uuid.UUID, approverID uuid.UUID, reason string) error {
	if reason == "" {
		return errors.New("rejection reason is required")
	}

	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservation: %w", err)
	}

	if reservation.Status != models.StatusPending {
		return errors.New("reservation is not pending approval")
	}

	if !s.canUserApproveReservation(reservation, approverID) {
		return errors.New("access denied")
	}

	err = s.reservationRepo.RejectReservation(reservationID, approverID, reason)
	if err != nil {
		return fmt.Errorf("failed to reject reservation: %w", err)
	}

	return nil
}

// ========================================
// CHECK-IN/OUT OPERATIONS
// ========================================

// CheckIn checks in to a reservation
func (s *ReservationService) CheckIn(reservationID uuid.UUID, userID uuid.UUID) error {
	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservation: %w", err)
	}

	// Basic validations
	if reservation.UserID != userID {
		return errors.New("can only check in to your own reservation")
	}

	if reservation.Status != models.StatusConfirmed {
		return errors.New("reservation must be confirmed to check in")
	}

	if reservation.CheckInTime != nil {
		return errors.New("already checked in")
	}

	// Check if it's time to check in (within 15 minutes of start time)
	now := time.Now()
	if now.Before(reservation.StartTime.Add(-15*time.Minute)) || now.After(reservation.EndTime) {
		return errors.New("can only check in within 15 minutes of start time")
	}

	err = s.reservationRepo.CheckIn(reservationID, now)
	if err != nil {
		return fmt.Errorf("failed to check in: %w", err)
	}

	return nil
}

// CheckOut checks out of a reservation
func (s *ReservationService) CheckOut(reservationID uuid.UUID, userID uuid.UUID) error {
	reservation, err := s.reservationRepo.GetByID(reservationID)
	if err != nil {
		return fmt.Errorf("failed to get reservation: %w", err)
	}

	if reservation.UserID != userID {
		return errors.New("can only check out of your own reservation")
	}

	if reservation.CheckInTime == nil {
		return errors.New("must check in before checking out")
	}

	if reservation.CheckOutTime != nil {
		return errors.New("already checked out")
	}

	now := time.Now()
	err = s.reservationRepo.CheckOut(reservationID, now)
	if err != nil {
		return fmt.Errorf("failed to check out: %w", err)
	}

	// Mark as completed if checked out
	_, err = s.reservationRepo.Update(reservationID, map[string]interface{}{
		"status": models.StatusCompleted,
	})
	if err != nil {
		return fmt.Errorf("failed to mark as completed: %w", err)
	}

	return nil
}

// ========================================
// SEARCH AND FILTER
// ========================================

// SearchReservations searches reservations with filters
func (s *ReservationService) SearchReservations(filters map[string]interface{}, offset, limit int, userID uuid.UUID) ([]*models.Reservation, int64, error) {
	// Check permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	// Regular users can only search their own reservations
	if user.Role == models.RoleStandardUser {
		filters["user_id"] = userID
	}

	if limit <= 0 {
		limit = 20
	}

	reservations, total, err := s.reservationRepo.SearchReservations(filters, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search reservations: %w", err)
	}

	return reservations, total, nil
}

// GetReservationsByDateRange gets reservations in a date range
func (s *ReservationService) GetReservationsByDateRange(startDate, endDate time.Time, offset, limit int, userID uuid.UUID) ([]*models.Reservation, int64, error) {
	// Check permissions
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	if limit <= 0 {
		limit = 50
	}

	// For regular users, only show their reservations
	if user.Role == models.RoleStandardUser {
		return s.reservationRepo.GetUserReservations(userID, offset, limit)
	}

	reservations, total, err := s.reservationRepo.GetReservationsByDateRange(startDate, endDate, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get reservations by date range: %w", err)
	}

	return reservations, total, nil
}

// GetReservationsByStatus gets reservations by status
func (s *ReservationService) GetReservationsByStatus(status string, offset, limit int, userID uuid.UUID) ([]*models.Reservation, int64, error) {
	// Check permissions - only admins and managers can filter by status
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user: %w", err)
	}

	if user.Role == models.RoleStandardUser {
		return nil, 0, errors.New("access denied")
	}

	if limit <= 0 {
		limit = 20
	}

	reservations, total, err := s.reservationRepo.GetReservationsByStatus(status, offset, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get reservations by status: %w", err)
	}

	return reservations, total, nil
}

// ========================================
// RECURRING RESERVATIONS
// ========================================

// GetRecurringReservations gets all reservations in a recurring series
func (s *ReservationService) GetRecurringReservations(parentID uuid.UUID, userID uuid.UUID) ([]*models.Reservation, error) {
	// Get parent reservation to check permissions
	parent, err := s.reservationRepo.GetByID(parentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get parent reservation: %w", err)
	}

	if !s.canUserAccessReservation(parent, userID) {
		return nil, errors.New("access denied")
	}

	reservations, err := s.reservationRepo.GetRecurringReservations(parentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get recurring reservations: %w", err)
	}

	return reservations, nil
}

// ========================================
// STATISTICS
// ========================================

// GetUserReservationCount gets total reservation count for a user
func (s *ReservationService) GetUserReservationCount(userID uuid.UUID) (int64, error) {
	count, err := s.reservationRepo.CountUserReservations(userID)
	if err != nil {
		return 0, fmt.Errorf("failed to count user reservations: %w", err)
	}

	return count, nil
}

// GetSpaceReservationCount gets total reservation count for a space
func (s *ReservationService) GetSpaceReservationCount(spaceID uuid.UUID, userID uuid.UUID) (int64, error) {
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

// canUserAccessReservation checks if user can access reservation
func (s *ReservationService) canUserAccessReservation(reservation *models.Reservation, userID uuid.UUID) bool {
	// Own reservation
	if reservation.UserID == userID {
		return true
	}

	// Admin/Manager check
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	if user.Role == models.RoleAdmin {
		return true
	}

	if user.Role == models.RoleManager {
		space, err := s.spaceRepo.GetByID(reservation.SpaceID)
		if err != nil {
			return false
		}
		return space.ManagerID != nil && *space.ManagerID == userID
	}

	return false
}

// canUserModifyReservation checks if user can modify reservation
func (s *ReservationService) canUserModifyReservation(reservation *models.Reservation, userID uuid.UUID) bool {
	// Own reservation
	if reservation.UserID == userID {
		return true
	}

	// Admin check
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	return user.Role == models.RoleAdmin
}

// canUserApproveReservation checks if user can approve reservation
func (s *ReservationService) canUserApproveReservation(reservation *models.Reservation, userID uuid.UUID) bool {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	if user.Role == models.RoleAdmin {
		return true
	}

	if user.Role == models.RoleManager {
		space, err := s.spaceRepo.GetByID(reservation.SpaceID)
		if err != nil {
			return false
		}
		return space.ManagerID != nil && *space.ManagerID == userID
	}

	return false
}

// canUserViewSpaceStats checks if user can view space statistics
func (s *ReservationService) canUserViewSpaceStats(spaceID uuid.UUID, userID uuid.UUID) bool {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false
	}

	if user.Role == models.RoleAdmin {
		return true
	}

	if user.Role == models.RoleManager {
		space, err := s.spaceRepo.GetByID(spaceID)
		if err != nil {
			return false
		}
		return space.ManagerID != nil && *space.ManagerID == userID
	}

	return false
}

// createRecurringInstances creates recurring reservation instances (simplified for PFE)
func (s *ReservationService) createRecurringInstances(parentReservation *models.Reservation, pattern *dto.RecurrencePattern) error {
	var instances []*models.Reservation
	currentStart := parentReservation.StartTime
	duration := parentReservation.EndTime.Sub(parentReservation.StartTime)
	maxOccurrences := 10 // Limit for PFE

	if pattern.MaxOccurrences != nil && *pattern.MaxOccurrences < maxOccurrences {
		maxOccurrences = *pattern.MaxOccurrences
	}

	for i := 0; i < maxOccurrences; i++ {
		var nextStart time.Time
		switch pattern.Type {
		case "daily":
			nextStart = currentStart.AddDate(0, 0, pattern.Interval)
		case "weekly":
			nextStart = currentStart.AddDate(0, 0, 7*pattern.Interval)
		case "monthly":
			nextStart = currentStart.AddDate(0, pattern.Interval, 0)
		default:
			return fmt.Errorf("unsupported recurrence type: %s", pattern.Type)
		}

		if pattern.EndDate != nil && nextStart.After(*pattern.EndDate) {
			break
		}

		nextEnd := nextStart.Add(duration)

		// Check availability
		available, err := s.reservationRepo.CheckTimeSlotAvailability(parentReservation.SpaceID, nextStart, nextEnd, nil)
		if err != nil || !available {
			continue
		}

		instance := &models.Reservation{
			UserID:             parentReservation.UserID,
			SpaceID:            parentReservation.SpaceID,
			StartTime:          nextStart,
			EndTime:            nextEnd,
			ParticipantCount:   parentReservation.ParticipantCount,
			Title:              parentReservation.Title,
			Description:        parentReservation.Description,
			Status:             parentReservation.Status,
			IsRecurring:        false,
			RecurrenceParentID: &parentReservation.ID,
		}

		instances = append(instances, instance)
		currentStart = nextStart
	}

	if len(instances) > 0 {
		_, err := s.reservationRepo.CreateBatch(instances)
		if err != nil {
			return fmt.Errorf("failed to create recurring instances: %w", err)
		}
	}

	return nil
}
