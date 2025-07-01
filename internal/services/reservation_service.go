// internal/services/reservation_service.go
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
	ErrReservationNotFound     = errors.New("reservation not found")
	ErrReservationConflict     = errors.New("reservation conflicts with existing booking")
	ErrInvalidReservationTime  = errors.New("invalid reservation time")
	ErrInsufficientCapacity    = errors.New("space capacity exceeded")
	ErrReservationInPast       = errors.New("cannot create reservation in the past")
	ErrCannotModifyReservation = errors.New("reservation cannot be modified")
	ErrUnauthorizedAccess      = errors.New("unauthorized access to reservation")
)

type ReservationService struct {
	db                  *gorm.DB
	spaceService        *SpaceService
	notificationService NotificationService
}

func NewReservationService(db *gorm.DB, spaceService *SpaceService, notificationService NotificationService) *ReservationService {
	return &ReservationService{
		db:                  db,
		spaceService:        spaceService,
		notificationService: notificationService,
	}
}

// CreateReservationRequest represents reservation creation request
type CreateReservationRequest struct {
	SpaceID           uuid.UUID                 `json:"space_id" validate:"required"`
	StartTime         time.Time                 `json:"start_time" validate:"required"`
	EndTime           time.Time                 `json:"end_time" validate:"required"`
	ParticipantCount  int                       `json:"participant_count" validate:"required,min=1"`
	Title             string                    `json:"title" validate:"required,min=2,max=200"`
	Description       string                    `json:"description"`
	IsRecurring       bool                      `json:"is_recurring"`
	RecurrencePattern *models.RecurrencePattern `json:"recurrence_pattern,omitempty"`
}

// UpdateReservationRequest represents reservation update request
type UpdateReservationRequest struct {
	StartTime        *time.Time `json:"start_time"`
	EndTime          *time.Time `json:"end_time"`
	ParticipantCount *int       `json:"participant_count" validate:"omitempty,min=1"`
	Title            *string    `json:"title" validate:"omitempty,min=2,max=200"`
	Description      *string    `json:"description"`
}

// ReservationFilter represents filters for reservation queries
type ReservationFilter struct {
	UserID    *uuid.UUID                `form:"user_id"`
	SpaceID   *uuid.UUID                `form:"space_id"`
	Status    *models.ReservationStatus `form:"status"`
	StartDate *time.Time                `form:"start_date"`
	EndDate   *time.Time                `form:"end_date"`
	Page      int                       `form:"page,default=1"`
	Limit     int                       `form:"limit,default=20"`
	SortBy    string                    `form:"sort_by,default=start_time"`
	SortOrder string                    `form:"sort_order,default=desc"`
}

// PaginatedReservationResponse represents paginated reservation response
type PaginatedReservationResponse struct {
	Data       []models.Reservation `json:"data"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(userID uuid.UUID, req CreateReservationRequest) (*models.Reservation, error) {
	// Validate time range
	if err := s.validateTimeRange(req.StartTime, req.EndTime); err != nil {
		return nil, err
	}

	// Get space details
	space, err := s.spaceService.GetSpaceByID(req.SpaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get space: %w", err)
	}

	// Validate capacity
	if req.ParticipantCount > space.Capacity {
		return nil, ErrInsufficientCapacity
	}

	// Check space availability
	availabilityReq := AvailabilityRequest{
		SpaceID:   req.SpaceID,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
	}

	availability, err := s.spaceService.CheckAvailability(availabilityReq)
	if err != nil {
		return nil, fmt.Errorf("failed to check availability: %w", err)
	}

	if !availability.Available {
		return nil, ErrReservationConflict
	}

	// Determine initial status
	status := models.StatusConfirmed
	if space.RequiresApproval {
		status = models.StatusPending
	}

	// Create reservation
	reservation := &models.Reservation{
		ID:               uuid.New(),
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

	// Handle recurring reservations
	if req.IsRecurring && req.RecurrencePattern != nil {
		return s.createRecurringReservation(reservation, req.RecurrencePattern)
	}

	// Create single reservation
	if err := s.db.Create(reservation).Error; err != nil {
		return nil, fmt.Errorf("failed to create reservation: %w", err)
	}

	// Load relationships
	if err := s.db.Preload("User").Preload("Space").First(reservation, reservation.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load reservation: %w", err)
	}

	// Send notifications
	go s.sendReservationNotifications(reservation, "created")

	return reservation, nil
}

// createRecurringReservation creates multiple reservations based on recurrence pattern
func (s *ReservationService) createRecurringReservation(baseReservation *models.Reservation, pattern *models.RecurrencePattern) (*models.Reservation, error) {
	// Create parent reservation
	if err := s.db.Create(baseReservation).Error; err != nil {
		return nil, fmt.Errorf("failed to create parent reservation: %w", err)
	}

	// Generate child reservations
	childReservations, err := s.generateRecurringReservations(baseReservation, pattern)
	if err != nil {
		return nil, fmt.Errorf("failed to generate recurring reservations: %w", err)
	}

	// Create child reservations in batch
	if len(childReservations) > 0 {
		if err := s.db.CreateInBatches(childReservations, 50).Error; err != nil {
			return nil, fmt.Errorf("failed to create child reservations: %w", err)
		}
	}

	// Load relationships
	if err := s.db.Preload("User").Preload("Space").First(baseReservation, baseReservation.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load reservation: %w", err)
	}

	return baseReservation, nil
}

// generateRecurringReservations generates child reservations based on pattern
func (s *ReservationService) generateRecurringReservations(parent *models.Reservation, pattern *models.RecurrencePattern) ([]models.Reservation, error) {
	var reservations []models.Reservation
	current := parent.StartTime
	duration := parent.EndTime.Sub(parent.StartTime)
	count := 0
	maxOccurrences := 100 // Default limit

	if pattern.MaxOccurrences != nil {
		maxOccurrences = *pattern.MaxOccurrences
	}

	for count < maxOccurrences {
		var nextTime time.Time

		switch pattern.Type {
		case models.RecurrenceDaily:
			nextTime = current.AddDate(0, 0, pattern.Interval)
		case models.RecurrenceWeekly:
			nextTime = current.AddDate(0, 0, 7*pattern.Interval)
		case models.RecurrenceMonthly:
			nextTime = current.AddDate(0, pattern.Interval, 0)
		default:
			return nil, fmt.Errorf("unsupported recurrence type: %s", pattern.Type)
		}

		// Check end date
		if pattern.EndDate != nil && nextTime.After(*pattern.EndDate) {
			break
		}

		// Check day of week for weekly recurrence
		if pattern.Type == models.RecurrenceWeekly && len(pattern.DaysOfWeek) > 0 {
			weekday := int(nextTime.Weekday())
			found := false
			for _, day := range pattern.DaysOfWeek {
				if day == weekday {
					found = true
					break
				}
			}
			if !found {
				current = nextTime
				continue
			}
		}

		// Create child reservation
		childReservation := models.Reservation{
			ID:                 uuid.New(),
			UserID:             parent.UserID,
			SpaceID:            parent.SpaceID,
			StartTime:          nextTime,
			EndTime:            nextTime.Add(duration),
			ParticipantCount:   parent.ParticipantCount,
			Title:              parent.Title,
			Description:        parent.Description,
			Status:             parent.Status,
			IsRecurring:        false,
			RecurrenceParentID: &parent.ID,
		}

		reservations = append(reservations, childReservation)
		current = nextTime
		count++
	}

	return reservations, nil
}

// GetReservations retrieves reservations with filters and pagination
func (s *ReservationService) GetReservations(filter ReservationFilter) (*PaginatedReservationResponse, error) {
	query := s.db.Model(&models.Reservation{}).
		Preload("User").
		Preload("Space").
		Preload("Approver")

	// Apply filters
	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.SpaceID != nil {
		query = query.Where("space_id = ?", *filter.SpaceID)
	}
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.StartDate != nil {
		query = query.Where("start_time >= ?", *filter.StartDate)
	}
	if filter.EndDate != nil {
		query = query.Where("end_time <= ?", *filter.EndDate)
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count reservations: %w", err)
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

	var reservations []models.Reservation
	if err := query.Find(&reservations).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch reservations: %w", err)
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return &PaginatedReservationResponse{
		Data:       reservations,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetReservationByID retrieves a reservation by ID
func (s *ReservationService) GetReservationByID(id uuid.UUID, userID uuid.UUID, userRole models.UserRole) (*models.Reservation, error) {
	var reservation models.Reservation
	if err := s.db.Preload("User").Preload("Space").Preload("Approver").Where("id = ?", id).First(&reservation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrReservationNotFound
		}
		return nil, fmt.Errorf("failed to fetch reservation: %w", err)
	}

	// Check access permissions
	if !s.canAccessReservation(&reservation, userID, userRole) {
		return nil, ErrUnauthorizedAccess
	}

	return &reservation, nil
}

// UpdateReservation updates an existing reservation
func (s *ReservationService) UpdateReservation(id uuid.UUID, userID uuid.UUID, userRole models.UserRole, req UpdateReservationRequest) (*models.Reservation, error) {
	reservation, err := s.GetReservationByID(id, userID, userRole)
	if err != nil {
		return nil, err
	}

	// Check if reservation can be modified
	if !reservation.CanBeModified() {
		return nil, ErrCannotModifyReservation
	}

	// Check if user can modify this reservation
	if reservation.UserID != userID && userRole != models.RoleAdmin {
		return nil, ErrUnauthorizedAccess
	}

	// Validate time changes if provided
	startTime := reservation.StartTime
	endTime := reservation.EndTime

	if req.StartTime != nil {
		startTime = *req.StartTime
	}
	if req.EndTime != nil {
		endTime = *req.EndTime
	}

	if req.StartTime != nil || req.EndTime != nil {
		if err := s.validateTimeRange(startTime, endTime); err != nil {
			return nil, err
		}

		// Check availability for new time slot
		availabilityReq := AvailabilityRequest{
			SpaceID:   reservation.SpaceID,
			StartTime: startTime,
			EndTime:   endTime,
		}

		availability, err := s.spaceService.CheckAvailability(availabilityReq)
		if err != nil {
			return nil, fmt.Errorf("failed to check availability: %w", err)
		}

		if !availability.Available {
			// Check if the conflict is only with the current reservation
			hasOtherConflicts := false
			for _, conflict := range availability.ConflictingReservations {
				if conflict.ID != reservation.ID {
					hasOtherConflicts = true
					break
				}
			}
			if hasOtherConflicts {
				return nil, ErrReservationConflict
			}
		}
	}

	// Update fields
	if req.StartTime != nil {
		reservation.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		reservation.EndTime = *req.EndTime
	}
	if req.ParticipantCount != nil {
		// Validate capacity
		space, err := s.spaceService.GetSpaceByID(reservation.SpaceID)
		if err != nil {
			return nil, fmt.Errorf("failed to get space: %w", err)
		}
		if *req.ParticipantCount > space.Capacity {
			return nil, ErrInsufficientCapacity
		}
		reservation.ParticipantCount = *req.ParticipantCount
	}
	if req.Title != nil {
		reservation.Title = *req.Title
	}
	if req.Description != nil {
		reservation.Description = *req.Description
	}

	// Reset to pending if space requires approval for modifications
	if reservation.Space.RequiresApproval && (req.StartTime != nil || req.EndTime != nil) {
		reservation.Status = models.StatusPending
		reservation.ApproverID = nil
		reservation.ApprovalComments = ""
	}

	if err := s.db.Save(reservation).Error; err != nil {
		return nil, fmt.Errorf("failed to update reservation: %w", err)
	}

	// Send notifications
	go s.sendReservationNotifications(reservation, "updated")

	return reservation, nil
}

// CancelReservation cancels a reservation
func (s *ReservationService) CancelReservation(id uuid.UUID, userID uuid.UUID, userRole models.UserRole, reason string) error {
	reservation, err := s.GetReservationByID(id, userID, userRole)
	if err != nil {
		return err
	}

	// Check if reservation can be cancelled
	if !reservation.CanBeCancelled() {
		return ErrCannotModifyReservation
	}

	// Check permissions
	if reservation.UserID != userID && userRole != models.RoleAdmin {
		return ErrUnauthorizedAccess
	}

	// Update reservation status
	reservation.Status = models.StatusCancelled
	reservation.CancellationReason = reason

	if err := s.db.Save(reservation).Error; err != nil {
		return fmt.Errorf("failed to cancel reservation: %w", err)
	}

	// Cancel child reservations if this is a recurring reservation
	if reservation.IsRecurring {
		if err := s.db.Model(&models.Reservation{}).
			Where("recurrence_parent_id = ? AND status IN ?",
				reservation.ID,
				[]models.ReservationStatus{models.StatusConfirmed, models.StatusPending}).
			Updates(map[string]interface{}{
				"status":              models.StatusCancelled,
				"cancellation_reason": "Parent reservation cancelled",
			}).Error; err != nil {
			return fmt.Errorf("failed to cancel child reservations: %w", err)
		}
	}

	// Send notifications
	go s.sendReservationNotifications(reservation, "cancelled")

	return nil
}

// ApproveReservation approves a pending reservation
func (s *ReservationService) ApproveReservation(id uuid.UUID, approverID uuid.UUID, comments string) error {
	var reservation models.Reservation
	if err := s.db.Preload("User").Preload("Space").Where("id = ?", id).First(&reservation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReservationNotFound
		}
		return fmt.Errorf("failed to fetch reservation: %w", err)
	}

	if reservation.Status != models.StatusPending {
		return fmt.Errorf("reservation is not pending approval")
	}

	// Update reservation
	reservation.Status = models.StatusConfirmed
	reservation.ApproverID = &approverID
	reservation.ApprovalComments = comments

	if err := s.db.Save(&reservation).Error; err != nil {
		return fmt.Errorf("failed to approve reservation: %w", err)
	}

	// Send notifications
	go s.sendReservationNotifications(&reservation, "approved")

	return nil
}

// RejectReservation rejects a pending reservation
func (s *ReservationService) RejectReservation(id uuid.UUID, approverID uuid.UUID, comments string) error {
	var reservation models.Reservation
	if err := s.db.Preload("User").Preload("Space").Where("id = ?", id).First(&reservation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReservationNotFound
		}
		return fmt.Errorf("failed to fetch reservation: %w", err)
	}

	if reservation.Status != models.StatusPending {
		return fmt.Errorf("reservation is not pending approval")
	}

	// Update reservation
	reservation.Status = models.StatusRejected
	reservation.ApproverID = &approverID
	reservation.ApprovalComments = comments

	if err := s.db.Save(&reservation).Error; err != nil {
		return fmt.Errorf("failed to reject reservation: %w", err)
	}

	// Send notifications
	go s.sendReservationNotifications(&reservation, "rejected")

	return nil
}

// Helper methods

func (s *ReservationService) validateTimeRange(startTime, endTime time.Time) error {
	if endTime.Before(startTime) || endTime.Equal(startTime) {
		return ErrInvalidReservationTime
	}

	if startTime.Before(time.Now().Add(30 * time.Minute)) {
		return ErrReservationInPast
	}

	return nil
}

func (s *ReservationService) canAccessReservation(reservation *models.Reservation, userID uuid.UUID, userRole models.UserRole) bool {
	// Admin can access all reservations
	if userRole == models.RoleAdmin {
		return true
	}

	// User can access their own reservations
	if reservation.UserID == userID {
		return true
	}

	// Manager can access reservations for their managed spaces
	if userRole == models.RoleManager && reservation.Space.ManagerID != nil && *reservation.Space.ManagerID == userID {
		return true
	}

	return false
}

func (s *ReservationService) sendReservationNotifications(reservation *models.Reservation, action string) {
	if s.notificationService == nil {
		return
	}

	// Implementation would send appropriate notifications based on action
	// This is a placeholder for the notification service integration
}

// NotificationService defines the interface for sending notifications
type NotificationService interface {
	SendReservationNotification(reservation *models.Reservation, action string) error
}
