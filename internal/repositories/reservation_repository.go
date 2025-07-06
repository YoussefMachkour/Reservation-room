// internal/repositories/reservation_repository.go
package repositories

import (
	"time"

	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReservationRepository implements the ReservationRepositoryInterface
type ReservationRepository struct {
	db *gorm.DB
}

// NewReservationRepository creates a new reservation repository
func NewReservationRepository(db *gorm.DB) interfaces.ReservationRepositoryInterface {
	return &ReservationRepository{db: db}
}

// ========================================
// BASIC CRUD OPERATIONS
// ========================================

// Create creates a new reservation
func (r *ReservationRepository) Create(reservation *models.Reservation) (*models.Reservation, error) {
	if err := r.db.Create(reservation).Error; err != nil {
		return nil, err
	}

	// Fetch the created reservation with relationships
	return r.GetByID(reservation.ID)
}

// GetByID retrieves a reservation by ID with relationships
func (r *ReservationRepository) GetByID(id uuid.UUID) (*models.Reservation, error) {
	var reservation models.Reservation
	err := r.db.Preload("User").Preload("Space").Preload("Approver").
		Where("id = ?", id).First(&reservation).Error
	if err != nil {
		return nil, err
	}
	return &reservation, nil
}

// Update updates a reservation
func (r *ReservationRepository) Update(id uuid.UUID, updates map[string]interface{}) (*models.Reservation, error) {
	if err := r.db.Model(&models.Reservation{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Return updated reservation
	return r.GetByID(id)
}

// Delete soft deletes a reservation
func (r *ReservationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Reservation{}, "id = ?", id).Error
}

// GetAll retrieves all reservations with pagination
func (r *ReservationRepository) GetAll(offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	// Count total
	if err := r.db.Model(&models.Reservation{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations with pagination
	err := r.db.Preload("User").Preload("Space").Preload("Approver").
		Order("start_time DESC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// ========================================
// USER-SPECIFIC OPERATIONS
// ========================================

// GetUserReservations retrieves all reservations for a user
func (r *ReservationRepository) GetUserReservations(userID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	// Count total
	if err := r.db.Model(&models.Reservation{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").Preload("Approver").
		Where("user_id = ?", userID).
		Order("start_time DESC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// GetUserUpcomingReservations retrieves upcoming reservations for a user
func (r *ReservationRepository) GetUserUpcomingReservations(userID uuid.UUID, limit int) ([]*models.Reservation, error) {
	var reservations []*models.Reservation

	err := r.db.Preload("User").Preload("Space").
		Where("user_id = ? AND start_time > ? AND status IN ?",
			userID, time.Now(), []string{"confirmed", "pending"}).
		Order("start_time ASC").
		Limit(limit).
		Find(&reservations).Error

	return reservations, err
}

// GetUserPastReservations retrieves past reservations for a user
func (r *ReservationRepository) GetUserPastReservations(userID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	// Count total
	if err := r.db.Model(&models.Reservation{}).
		Where("user_id = ? AND end_time < ?", userID, time.Now()).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").
		Where("user_id = ? AND end_time < ?", userID, time.Now()).
		Order("start_time DESC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// GetUserActiveReservation retrieves the currently active reservation for a user
func (r *ReservationRepository) GetUserActiveReservation(userID uuid.UUID) (*models.Reservation, error) {
	var reservation models.Reservation
	now := time.Now()

	err := r.db.Preload("User").Preload("Space").
		Where("user_id = ? AND start_time <= ? AND end_time > ? AND status = ?",
			userID, now, now, "confirmed").
		First(&reservation).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // No active reservation
		}
		return nil, err
	}

	return &reservation, nil
}

// ========================================
// SPACE-SPECIFIC OPERATIONS
// ========================================

// GetSpaceReservations retrieves reservations for a space
func (r *ReservationRepository) GetSpaceReservations(spaceID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	// Count total
	if err := r.db.Model(&models.Reservation{}).Where("space_id = ?", spaceID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").
		Where("space_id = ?", spaceID).
		Order("start_time DESC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// GetSpaceReservationsByDateRange retrieves reservations for a space within a date range
func (r *ReservationRepository) GetSpaceReservationsByDateRange(spaceID uuid.UUID, startDate, endDate time.Time, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	query := r.db.Model(&models.Reservation{}).
		Where("space_id = ? AND start_time >= ? AND end_time <= ?", spaceID, startDate, endDate)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").
		Where("space_id = ? AND start_time >= ? AND end_time <= ?", spaceID, startDate, endDate).
		Order("start_time ASC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// GetConflictingReservations finds reservations that conflict with a given time range
func (r *ReservationRepository) GetConflictingReservations(spaceID uuid.UUID, startTime, endTime time.Time) ([]*models.Reservation, error) {
	var reservations []*models.Reservation

	err := r.db.Preload("User").Preload("Space").
		Where("space_id = ? AND status IN ? AND start_time < ? AND end_time > ?",
			spaceID, []string{"confirmed", "pending"}, endTime, startTime).
		Find(&reservations).Error

	return reservations, err
}

// CheckTimeSlotAvailability checks if a time slot is available
func (r *ReservationRepository) CheckTimeSlotAvailability(spaceID uuid.UUID, startTime, endTime time.Time, excludeReservationID *uuid.UUID) (bool, error) {
	var count int64

	query := r.db.Model(&models.Reservation{}).
		Where("space_id = ? AND status IN ? AND start_time < ? AND end_time > ?",
			spaceID, []string{"confirmed", "pending"}, endTime, startTime)

	// Exclude specific reservation if provided
	if excludeReservationID != nil {
		query = query.Where("id != ?", *excludeReservationID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count == 0, nil
}

// ========================================
// APPROVAL OPERATIONS
// ========================================

// GetPendingApprovals retrieves reservations pending approval for a manager
func (r *ReservationRepository) GetPendingApprovals(managerID uuid.UUID, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	// Subquery to get space IDs managed by the manager
	subQuery := r.db.Model(&models.Space{}).Select("id").Where("manager_id = ?", managerID)

	// Count total
	if err := r.db.Model(&models.Reservation{}).
		Where("status = ? AND space_id IN (?)", "pending", subQuery).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").
		Where("status = ? AND space_id IN (?)", "pending", subQuery).
		Order("created_at ASC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// ApproveReservation approves a reservation
func (r *ReservationRepository) ApproveReservation(id uuid.UUID, approverID uuid.UUID, comments string) error {
	updates := map[string]interface{}{
		"status":            "confirmed",
		"approver_id":       approverID,
		"approval_comments": comments,
	}

	return r.db.Model(&models.Reservation{}).Where("id = ?", id).Updates(updates).Error
}

// RejectReservation rejects a reservation
func (r *ReservationRepository) RejectReservation(id uuid.UUID, approverID uuid.UUID, reason string) error {
	updates := map[string]interface{}{
		"status":              "rejected",
		"approver_id":         approverID,
		"cancellation_reason": reason,
	}

	return r.db.Model(&models.Reservation{}).Where("id = ?", id).Updates(updates).Error
}

// ========================================
// CHECK-IN/OUT OPERATIONS
// ========================================

// CheckIn records check-in time for a reservation
func (r *ReservationRepository) CheckIn(id uuid.UUID, checkInTime time.Time) error {
	return r.db.Model(&models.Reservation{}).
		Where("id = ?", id).
		Update("check_in_time", checkInTime).Error
}

// CheckOut records check-out time for a reservation
func (r *ReservationRepository) CheckOut(id uuid.UUID, checkOutTime time.Time) error {
	return r.db.Model(&models.Reservation{}).
		Where("id = ?", id).
		Update("check_out_time", checkOutTime).Error
}

// ========================================
// SEARCH AND FILTER
// ========================================

// SearchReservations searches reservations with filters
func (r *ReservationRepository) SearchReservations(filters map[string]interface{}, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	query := r.db.Model(&models.Reservation{})

	// Apply filters
	for key, value := range filters {
		switch key {
		case "user_id":
			if userID, ok := value.(uuid.UUID); ok {
				query = query.Where("user_id = ?", userID)
			}
		case "space_id":
			if spaceID, ok := value.(uuid.UUID); ok {
				query = query.Where("space_id = ?", spaceID)
			}
		case "status":
			if status, ok := value.(string); ok {
				query = query.Where("status = ?", status)
			}
		case "start_date":
			if startDate, ok := value.(time.Time); ok {
				query = query.Where("start_time >= ?", startDate)
			}
		case "end_date":
			if endDate, ok := value.(time.Time); ok {
				query = query.Where("end_time <= ?", endDate)
			}
		case "title":
			if title, ok := value.(string); ok {
				query = query.Where("title ILIKE ?", "%"+title+"%")
			}
		}
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := query.Preload("User").Preload("Space").Preload("Approver").
		Order("start_time DESC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// GetReservationsByDateRange retrieves reservations within a date range
func (r *ReservationRepository) GetReservationsByDateRange(startDate, endDate time.Time, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	query := r.db.Model(&models.Reservation{}).
		Where("start_time >= ? AND end_time <= ?", startDate, endDate)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").
		Where("start_time >= ? AND end_time <= ?", startDate, endDate).
		Order("start_time ASC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// GetReservationsByStatus retrieves reservations filtered by status
func (r *ReservationRepository) GetReservationsByStatus(status string, offset, limit int) ([]*models.Reservation, int64, error) {
	var reservations []*models.Reservation
	var total int64

	// Count total
	if err := r.db.Model(&models.Reservation{}).Where("status = ?", status).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get reservations
	err := r.db.Preload("User").Preload("Space").
		Where("status = ?", status).
		Order("start_time DESC").
		Offset(offset).Limit(limit).
		Find(&reservations).Error

	return reservations, total, err
}

// ========================================
// RECURRING RESERVATIONS
// ========================================

// CreateBatch creates multiple reservations in a single transaction
func (r *ReservationRepository) CreateBatch(reservations []*models.Reservation) ([]*models.Reservation, error) {
	if len(reservations) == 0 {
		return []*models.Reservation{}, nil
	}

	err := r.db.Transaction(func(tx *gorm.DB) error {
		for _, reservation := range reservations {
			if err := tx.Create(reservation).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return reservations, nil
}

// GetRecurringReservations retrieves all reservations in a recurring series
func (r *ReservationRepository) GetRecurringReservations(parentID uuid.UUID) ([]*models.Reservation, error) {
	var reservations []*models.Reservation

	err := r.db.Preload("User").Preload("Space").
		Where("recurrence_parent_id = ?", parentID).
		Order("start_time ASC").
		Find(&reservations).Error

	return reservations, err
}

// ========================================
// SIMPLE COUNTS (for basic statistics)
// ========================================

// CountUserReservations counts total reservations for a user
func (r *ReservationRepository) CountUserReservations(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

// CountSpaceReservations counts total reservations for a space
func (r *ReservationRepository) CountSpaceReservations(spaceID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).Where("space_id = ?", spaceID).Count(&count).Error
	return count, err
}

func (r *ReservationRepository) HasActiveReservationsForSpace(spaceID uuid.UUID) (bool, error) {
	var count int64
	now := time.Now()

	err := r.db.Model(&models.Reservation{}).
		Where("space_id = ? AND status IN ? AND start_time <= ? AND end_time > ?",
			spaceID, []string{"confirmed", "pending"}, now, now).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
