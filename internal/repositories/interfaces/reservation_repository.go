// internal/repositories/interfaces/reservation_repository.go
package interfaces

import (
	"time"

	"room-reservation-api/internal/models"

	"github.com/google/uuid"
)

// ReservationRepositoryInterface defines the contract for reservation data operations
type ReservationRepositoryInterface interface {
	// ========================================
	// BASIC CRUD OPERATIONS
	// ========================================
	Create(reservation *models.Reservation) (*models.Reservation, error)
	GetByID(id uuid.UUID) (*models.Reservation, error)
	Update(id uuid.UUID, updates map[string]interface{}) (*models.Reservation, error)
	Delete(id uuid.UUID) error
	GetAll(offset, limit int) ([]*models.Reservation, int64, error)

	// ========================================
	// USER-SPECIFIC OPERATIONS
	// ========================================
	GetUserReservations(userID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error)
	GetUserUpcomingReservations(userID uuid.UUID, limit int) ([]*models.Reservation, error)
	GetUserPastReservations(userID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error)
	GetUserActiveReservation(userID uuid.UUID) (*models.Reservation, error)
	HasActiveReservationsForSpace(spaceID uuid.UUID) (bool, error)

	// ========================================
	// SPACE-SPECIFIC OPERATIONS
	// ========================================
	GetSpaceReservations(spaceID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error)
	GetSpaceReservationsByDateRange(spaceID uuid.UUID, startDate, endDate time.Time, offset, limit int) ([]*models.Reservation, int64, error)
	GetConflictingReservations(spaceID uuid.UUID, startTime, endTime time.Time) ([]*models.Reservation, error)
	CheckTimeSlotAvailability(spaceID uuid.UUID, startTime, endTime time.Time, excludeReservationID *uuid.UUID) (bool, error)

	// ========================================
	// APPROVAL OPERATIONS
	// ========================================
	GetPendingApprovals(managerID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error)
	ApproveReservation(id uuid.UUID, approverID uuid.UUID, comments string) error
	RejectReservation(id uuid.UUID, approverID uuid.UUID, reason string) error

	// ========================================
	// CHECK-IN/OUT OPERATIONS
	// ========================================
	CheckIn(id uuid.UUID, checkInTime time.Time) error
	CheckOut(id uuid.UUID, checkOutTime time.Time) error

	// ========================================
	// SEARCH AND FILTER
	// ========================================
	SearchReservations(filters map[string]interface{}, offset, limit int) ([]*models.Reservation, int64, error)
	GetReservationsByDateRange(startDate, endDate time.Time, offset, limit int) ([]*models.Reservation, int64, error)
	GetReservationsByStatus(status string, offset, limit int) ([]*models.Reservation, int64, error)

	// ========================================
	// RECURRING RESERVATIONS
	// ========================================
	CreateBatch(reservations []*models.Reservation) ([]*models.Reservation, error)
	GetRecurringReservations(parentID uuid.UUID) ([]*models.Reservation, error)

	// ========================================
	// SIMPLE COUNTS (for basic statistics)
	// ========================================
	CountUserReservations(userID uuid.UUID) (int64, error)
	CountSpaceReservations(spaceID uuid.UUID) (int64, error)
}

// ReservationFilters represents search filters (simplified)
type ReservationFilters struct {
	UserID    *uuid.UUID `json:"user_id,omitempty"`
	SpaceID   *uuid.UUID `json:"space_id,omitempty"`
	Status    *string    `json:"status,omitempty"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	Title     *string    `json:"title,omitempty"`
}

// ReservationSummary represents basic reservation statistics
type ReservationSummary struct {
	TotalReservations int            `json:"total_reservations"`
	StatusBreakdown   map[string]int `json:"status_breakdown"`
	TotalHours        float64        `json:"total_hours"`
}
