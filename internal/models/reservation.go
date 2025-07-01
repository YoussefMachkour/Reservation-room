// internal/models/reservation.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ReservationStatus string
type RecurrenceType string

const (
	StatusConfirmed ReservationStatus = "confirmed"
	StatusPending   ReservationStatus = "pending"
	StatusCancelled ReservationStatus = "cancelled"
	StatusCompleted ReservationStatus = "completed"
	StatusRejected  ReservationStatus = "rejected"

	RecurrenceNone    RecurrenceType = "none"
	RecurrenceDaily   RecurrenceType = "daily"
	RecurrenceWeekly  RecurrenceType = "weekly"
	RecurrenceMonthly RecurrenceType = "monthly"
)

type RecurrencePattern struct {
	Type           RecurrenceType `json:"type"`
	Interval       int            `json:"interval"`        // Every N days/weeks/months
	DaysOfWeek     []int          `json:"days_of_week"`    // For weekly: 0=Sunday, 1=Monday, etc.
	EndDate        *time.Time     `json:"end_date"`        // When recurrence ends
	MaxOccurrences *int           `json:"max_occurrences"` // Max number of occurrences
}

type Reservation struct {
	ID                 uuid.UUID         `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID             uuid.UUID         `json:"user_id" gorm:"type:uuid;not null;index" validate:"required"`
	SpaceID            uuid.UUID         `json:"space_id" gorm:"type:uuid;not null;index" validate:"required"`
	StartTime          time.Time         `json:"start_time" gorm:"not null;index" validate:"required"`
	EndTime            time.Time         `json:"end_time" gorm:"not null;index" validate:"required"`
	ParticipantCount   int               `json:"participant_count" gorm:"not null;check:participant_count > 0" validate:"required,min=1"`
	Title              string            `json:"title" gorm:"not null;size:200" validate:"required,min=2,max=200"`
	Description        string            `json:"description" gorm:"type:text"`
	Status             ReservationStatus `json:"status" gorm:"type:varchar(20);default:'confirmed';index"`
	IsRecurring        bool              `json:"is_recurring" gorm:"default:false"`
	RecurrenceParentID *uuid.UUID        `json:"recurrence_parent_id" gorm:"type:uuid;index"`
	RecurrencePattern  datatypes.JSON    `json:"recurrence_pattern" gorm:"type:jsonb"`
	ApproverID         *uuid.UUID        `json:"approver_id" gorm:"type:uuid"`
	ApprovalComments   string            `json:"approval_comments" gorm:"type:text"`
	CancellationReason string            `json:"cancellation_reason" gorm:"type:text"`
	CheckInTime        *time.Time        `json:"check_in_time"`
	CheckOutTime       *time.Time        `json:"check_out_time"`
	NoShowReported     bool              `json:"no_show_reported" gorm:"default:false"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`
	DeletedAt          gorm.DeletedAt    `json:"-" gorm:"index"`

	// Relationships
	User     User  `json:"user" gorm:"foreignKey:UserID"`
	Space    Space `json:"space" gorm:"foreignKey:SpaceID"`
	Approver *User `json:"approver,omitempty" gorm:"foreignKey:ApproverID"`

	// Child reservations for recurring bookings
	ChildReservations []Reservation `json:"child_reservations,omitempty" gorm:"foreignKey:RecurrenceParentID"`
}

// TableName returns the table name for Reservation model
func (Reservation) TableName() string {
	return "reservations"
}

// BeforeCreate hook to set ID if not provided
func (r *Reservation) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// Duration returns the duration of the reservation
func (r *Reservation) Duration() time.Duration {
	return r.EndTime.Sub(r.StartTime)
}

// IsActive checks if reservation is currently active
func (r *Reservation) IsActive() bool {
	now := time.Now()
	return r.Status == StatusConfirmed &&
		now.After(r.StartTime) &&
		now.Before(r.EndTime)
}

// IsUpcoming checks if reservation is upcoming
func (r *Reservation) IsUpcoming() bool {
	return r.Status == StatusConfirmed && time.Now().Before(r.StartTime)
}

// IsPast checks if reservation is in the past
func (r *Reservation) IsPast() bool {
	return time.Now().After(r.EndTime)
}

// CanBeCancelled checks if reservation can be cancelled
func (r *Reservation) CanBeCancelled() bool {
	return r.Status == StatusConfirmed || r.Status == StatusPending
}

// CanBeModified checks if reservation can be modified
func (r *Reservation) CanBeModified() bool {
	return (r.Status == StatusConfirmed || r.Status == StatusPending) &&
		time.Now().Before(r.StartTime.Add(-30*time.Minute)) // 30 min before start
}

// GetRecurrencePattern returns the recurrence pattern
func (r *Reservation) GetRecurrencePattern() *RecurrencePattern {
	if !r.IsRecurring || r.RecurrencePattern == nil {
		return nil
	}

	var pattern RecurrencePattern
	// Parse JSON to RecurrencePattern struct
	// Implementation depends on your JSON handling

	return &pattern
}

// ConflictsWith checks if this reservation conflicts with another
func (r *Reservation) ConflictsWith(other *Reservation) bool {
	if r.SpaceID != other.SpaceID {
		return false
	}

	// Check if time ranges overlap
	return r.StartTime.Before(other.EndTime) && other.StartTime.Before(r.EndTime)
}
