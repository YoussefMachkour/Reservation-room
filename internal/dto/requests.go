package dto

import (
	"errors"
	"room-reservation-api/internal/models"
	"time"

	"github.com/google/uuid"
)

/*

AUTH REQUESTS

*/

// Auth Requests
type RegisterRequest struct {
	FirstName  string `json:"first_name" binding:"required,min=2,max=100"`
	LastName   string `json:"last_name" binding:"required,min=2,max=100"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	Phone      string `json:"phone" binding:"omitempty,e164"`
	Department string `json:"department" binding:"omitempty,max=100"`
	Position   string `json:"position" binding:"omitempty,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// User Profile Requests
type UpdateProfileRequest struct {
	FirstName      string `json:"first_name" binding:"omitempty,min=2,max=100"`
	LastName       string `json:"last_name" binding:"omitempty,min=2,max=100"`
	Phone          string `json:"phone" binding:"omitempty,e164"`
	ProfilePicture string `json:"profile_picture" binding:"omitempty,max=255"`
	Department     string `json:"department" binding:"omitempty,max=100"`
	Position       string `json:"position" binding:"omitempty,max=100"`
}

// Admin Requests
type UpdateUserRoleRequest struct {
	Role models.UserRole `json:"role" binding:"required,oneof=admin manager user"`
}

// Query Parameters
type GetUsersQuery struct {
	Page     int    `form:"page,default=1" binding:"min=1"`
	Limit    int    `form:"limit,default=10" binding:"min=1,max=100"`
	Search   string `form:"search"`
	Role     string `form:"role" binding:"omitempty,oneof=admin manager user"`
	IsActive *bool  `form:"is_active"`
}

/*

SPACE REQUESTS

*/

// CreateSpaceRequest represents the request body for creating a new space
type CreateSpaceRequest struct {
	Name               string      `json:"name" binding:"required,min=2,max=100"`
	Type               string      `json:"type" binding:"required,oneof=meeting_room office auditorium open_space hot_desk conference_room"`
	Capacity           int         `json:"capacity" binding:"required,min=1,max=1000"`
	Building           string      `json:"building" binding:"required,min=1,max=50"`
	Floor              int         `json:"floor" binding:"required"`
	RoomNumber         string      `json:"room_number" binding:"required,min=1,max=20"`
	Equipment          []Equipment `json:"equipment,omitempty"`
	Description        string      `json:"description,omitempty"`
	Surface            float64     `json:"surface,omitempty" binding:"omitempty,min=0"`
	Photos             []string    `json:"photos,omitempty"`
	PricePerHour       float64     `json:"price_per_hour,omitempty" binding:"omitempty,min=0"`
	PricePerDay        float64     `json:"price_per_day,omitempty" binding:"omitempty,min=0"`
	PricePerMonth      float64     `json:"price_per_month,omitempty" binding:"omitempty,min=0"`
	ManagerID          *uuid.UUID  `json:"manager_id,omitempty"`
	RequiresApproval   bool        `json:"requires_approval"`
	BookingAdvanceTime int         `json:"booking_advance_time,omitempty" binding:"omitempty,min=0"`
	MaxBookingDuration int         `json:"max_booking_duration,omitempty" binding:"omitempty,min=30"`
}

// UpdateSpaceRequest represents the request body for updating a space
type UpdateSpaceRequest struct {
	Name               *string     `json:"name,omitempty" binding:"omitempty,min=2,max=100"`
	Type               *string     `json:"type,omitempty" binding:"omitempty,oneof=meeting_room office auditorium open_space hot_desk conference_room"`
	Capacity           *int        `json:"capacity,omitempty" binding:"omitempty,min=1,max=1000"`
	Building           *string     `json:"building,omitempty" binding:"omitempty,min=1,max=50"`
	Floor              *int        `json:"floor,omitempty"`
	RoomNumber         *string     `json:"room_number,omitempty" binding:"omitempty,min=1,max=20"`
	Equipment          []Equipment `json:"equipment,omitempty"`
	Status             *string     `json:"status,omitempty" binding:"omitempty,oneof=available maintenance out_of_service reserved"`
	Description        *string     `json:"description,omitempty"`
	Surface            *float64    `json:"surface,omitempty" binding:"omitempty,min=0"`
	Photos             []string    `json:"photos,omitempty"`
	PricePerHour       *float64    `json:"price_per_hour,omitempty" binding:"omitempty,min=0"`
	PricePerDay        *float64    `json:"price_per_day,omitempty" binding:"omitempty,min=0"`
	PricePerMonth      *float64    `json:"price_per_month,omitempty" binding:"omitempty,min=0"`
	ManagerID          *uuid.UUID  `json:"manager_id,omitempty"`
	RequiresApproval   *bool       `json:"requires_approval,omitempty"`
	BookingAdvanceTime *int        `json:"booking_advance_time,omitempty" binding:"omitempty,min=0"`
	MaxBookingDuration *int        `json:"max_booking_duration,omitempty" binding:"omitempty,min=30"`
}

// Equipment represents equipment in a space
type Equipment struct {
	Name        string `json:"name" binding:"required"`
	Quantity    int    `json:"quantity" binding:"required,min=1"`
	Description string `json:"description,omitempty"`
}

// SpaceSearchRequest represents the request for searching spaces
type SpaceSearchRequest struct {
	Query       string   `json:"query,omitempty" form:"query"`
	Types       []string `json:"types,omitempty" form:"types"`
	Building    string   `json:"building,omitempty" form:"building"`
	Buildings   []string `json:"buildings,omitempty" form:"buildings"`
	Floor       *int     `json:"floor,omitempty" form:"floor"`
	Floors      []int    `json:"floors,omitempty" form:"floors"`
	MinCapacity *int     `json:"min_capacity,omitempty" form:"min_capacity" binding:"omitempty,min=1"`
	MaxCapacity *int     `json:"max_capacity,omitempty" form:"max_capacity" binding:"omitempty,min=1"`
	Status      []string `json:"status,omitempty" form:"status"`
	Equipment   []string `json:"equipment,omitempty" form:"equipment"`
	Page        int      `json:"page,omitempty" form:"page" binding:"omitempty,min=1"`
	Limit       int      `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
	SortBy      string   `json:"sort_by,omitempty" form:"sort_by"`
	SortOrder   string   `json:"sort_order,omitempty" form:"sort_order"`
}

// SpaceAvailabilityRequest represents the request for checking space availability
type SpaceAvailabilityRequest struct {
	SpaceID   uuid.UUID `json:"space_id" binding:"required"`
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time" binding:"required"`
}

// BulkSpaceStatusRequest represents the request for bulk status updates
type BulkSpaceStatusRequest struct {
	SpaceIDs []uuid.UUID `json:"space_ids" binding:"required,min=1"`
	Status   string      `json:"status" binding:"required,oneof=available maintenance out_of_service reserved"`
}

// SpaceFiltersRequest represents advanced filtering options
type SpaceFiltersRequest struct {
	Types              []string   `json:"types,omitempty" form:"types"`
	Buildings          []string   `json:"buildings,omitempty" form:"buildings"`
	Floors             []int      `json:"floors,omitempty" form:"floors"`
	MinCapacity        *int       `json:"min_capacity,omitempty" form:"min_capacity"`
	MaxCapacity        *int       `json:"max_capacity,omitempty" form:"max_capacity"`
	RequiredEquipment  []string   `json:"required_equipment,omitempty" form:"required_equipment"`
	Status             []string   `json:"status,omitempty" form:"status"`
	RequiresApproval   *bool      `json:"requires_approval,omitempty" form:"requires_approval"`
	MaxPricePerHour    *float64   `json:"max_price_per_hour,omitempty" form:"max_price_per_hour"`
	MaxPricePerDay     *float64   `json:"max_price_per_day,omitempty" form:"max_price_per_day"`
	MaxPricePerMonth   *float64   `json:"max_price_per_month,omitempty" form:"max_price_per_month"`
	AvailableStartTime *time.Time `json:"available_start_time,omitempty" form:"available_start_time"`
	AvailableEndTime   *time.Time `json:"available_end_time,omitempty" form:"available_end_time"`
	SortBy             string     `json:"sort_by,omitempty" form:"sort_by" binding:"omitempty,oneof=name capacity price_per_hour price_per_day price_per_month created_at"`
	SortOrder          string     `json:"sort_order,omitempty" form:"sort_order" binding:"omitempty,oneof=asc desc"`
	Page               int        `json:"page,omitempty" form:"page" binding:"omitempty,min=1"`
	Limit              int        `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
}

// SetDefaults sets default values for pagination
func (r *SpaceSearchRequest) SetDefaults() {
	if r.Page == 0 {
		r.Page = 1
	}
	if r.Limit == 0 {
		r.Limit = 10
	}
}

// SetDefaults sets default values for advanced filters
func (r *SpaceFiltersRequest) SetDefaults() {
	if r.Page == 0 {
		r.Page = 1
	}
	if r.Limit == 0 {
		r.Limit = 10
	}
	if r.SortBy == "" {
		r.SortBy = "name"
	}
	if r.SortOrder == "" {
		r.SortOrder = "asc"
	}
}

// GetOffset calculates the offset for pagination
func (r *SpaceSearchRequest) GetOffset() int {
	return (r.Page - 1) * r.Limit
}

// GetOffset calculates the offset for pagination
func (r *SpaceFiltersRequest) GetOffset() int {
	return (r.Page - 1) * r.Limit
}

// Validate validates the availability request
func (r *SpaceAvailabilityRequest) Validate() error {
	if r.StartTime.After(r.EndTime) {
		return errors.New("start time must be before end time")
	}

	if r.StartTime.Before(time.Now()) {
		return errors.New("start time must be in the future")
	}

	return nil
}

// Validate validates the search request
func (r *SpaceSearchRequest) Validate() error {
	if r.MinCapacity != nil && r.MaxCapacity != nil && *r.MinCapacity > *r.MaxCapacity {
		return errors.New("min capacity must be less than or equal to max capacity")
	}

	return nil
}

// Validate validates the filters request
func (r *SpaceFiltersRequest) Validate() error {
	if r.MinCapacity != nil && r.MaxCapacity != nil && *r.MinCapacity > *r.MaxCapacity {
		return errors.New("min capacity must be less than or equal to max capacity")
	}

	if r.AvailableStartTime != nil && r.AvailableEndTime != nil && r.AvailableStartTime.After(*r.AvailableEndTime) {
		return errors.New("available start time must be before end time")
	}

	return nil
}

/*

RESERVATION REQUESTS

*/

// CreateReservationRequest represents the request body for creating a new reservation
type CreateReservationRequest struct {
	SpaceID           uuid.UUID          `json:"space_id" binding:"required"`
	StartTime         time.Time          `json:"start_time" binding:"required"`
	EndTime           time.Time          `json:"end_time" binding:"required"`
	ParticipantCount  int                `json:"participant_count" binding:"required,min=1"`
	Title             string             `json:"title" binding:"required,min=2,max=200"`
	Description       string             `json:"description,omitempty"`
	IsRecurring       bool               `json:"is_recurring"`
	RecurrencePattern *RecurrencePattern `json:"recurrence_pattern,omitempty"`
}

// UpdateReservationRequest represents the request body for updating a reservation
type UpdateReservationRequest struct {
	StartTime        *time.Time `json:"start_time,omitempty"`
	EndTime          *time.Time `json:"end_time,omitempty"`
	ParticipantCount *int       `json:"participant_count,omitempty" binding:"omitempty,min=1"`
	Title            *string    `json:"title,omitempty" binding:"omitempty,min=2,max=200"`
	Description      *string    `json:"description,omitempty"`
}

// RecurrencePattern represents recurrence configuration
type RecurrencePattern struct {
	Type           string     `json:"type" binding:"required,oneof=daily weekly monthly"`
	Interval       int        `json:"interval" binding:"required,min=1,max=365"`
	DaysOfWeek     []int      `json:"days_of_week,omitempty" binding:"omitempty,dive,min=0,max=6"`
	EndDate        *time.Time `json:"end_date,omitempty"`
	MaxOccurrences *int       `json:"max_occurrences,omitempty" binding:"omitempty,min=1,max=100"`
}

// ReservationSearchRequest represents the request for searching reservations
type ReservationSearchRequest struct {
	Query            string     `json:"query,omitempty" form:"query"`
	SpaceIDs         []string   `json:"space_ids,omitempty" form:"space_ids"`
	UserIDs          []string   `json:"user_ids,omitempty" form:"user_ids"`
	Statuses         []string   `json:"statuses,omitempty" form:"statuses"`
	StartDate        *time.Time `json:"start_date,omitempty" form:"start_date"`
	EndDate          *time.Time `json:"end_date,omitempty" form:"end_date"`
	MinParticipants  *int       `json:"min_participants,omitempty" form:"min_participants" binding:"omitempty,min=1"`
	MaxParticipants  *int       `json:"max_participants,omitempty" form:"max_participants" binding:"omitempty,min=1"`
	IsRecurring      *bool      `json:"is_recurring,omitempty" form:"is_recurring"`
	RequiresApproval *bool      `json:"requires_approval,omitempty" form:"requires_approval"`
	IncludeCheckedIn *bool      `json:"include_checked_in,omitempty" form:"include_checked_in"`
	IncludeNoShows   *bool      `json:"include_no_shows,omitempty" form:"include_no_shows"`
	SortBy           string     `json:"sort_by,omitempty" form:"sort_by" binding:"omitempty,oneof=start_time end_time created_at title participant_count"`
	SortOrder        string     `json:"sort_order,omitempty" form:"sort_order" binding:"omitempty,oneof=asc desc"`
	Page             int        `json:"page,omitempty" form:"page" binding:"omitempty,min=1"`
	Limit            int        `json:"limit,omitempty" form:"limit" binding:"omitempty,min=1,max=100"`
}

// ApprovalRequest represents a request to approve or reject a reservation
type ApprovalRequest struct {
	Action   string `json:"action" binding:"required,oneof=approve reject"`
	Comments string `json:"comments,omitempty"`
	Reason   string `json:"reason,omitempty"`
}

// BulkApprovalRequest represents a bulk approval/rejection request
type BulkApprovalRequest struct {
	ReservationIDs []uuid.UUID `json:"reservation_ids" binding:"required,min=1"`
	Action         string      `json:"action" binding:"required,oneof=approve reject"`
	Comments       string      `json:"comments,omitempty"`
	Reason         string      `json:"reason,omitempty"`
}

// CancelReservationRequest represents a cancellation request
type CancelReservationRequest struct {
	Reason          string `json:"reason,omitempty"`
	CancelFuture    bool   `json:"cancel_future,omitempty"`    // For recurring reservations
	CancelRemaining bool   `json:"cancel_remaining,omitempty"` // Cancel all remaining in series
}

// CheckInRequest represents a check-in request
type CheckInRequest struct {
	CheckInTime *time.Time `json:"check_in_time,omitempty"`
	Notes       string     `json:"notes,omitempty"`
}

// CheckOutRequest represents a check-out request
type CheckOutRequest struct {
	CheckOutTime *time.Time `json:"check_out_time,omitempty"`
	Notes        string     `json:"notes,omitempty"`
	Rating       *int       `json:"rating,omitempty" binding:"omitempty,min=1,max=5"`
	Feedback     string     `json:"feedback,omitempty"`
}

// NoShowRequest represents a no-show report request
type NoShowRequest struct {
	Reason       string     `json:"reason" binding:"required"`
	ReportedBy   string     `json:"reported_by,omitempty"`
	ReportedTime *time.Time `json:"reported_time,omitempty"`
}

// ExtendReservationRequest represents a request to extend a reservation
type ExtendReservationRequest struct {
	NewEndTime time.Time `json:"new_end_time" binding:"required"`
	Reason     string    `json:"reason,omitempty"`
}

// RecurringUpdateRequest represents updates to recurring reservations
type RecurringUpdateRequest struct {
	UpdateScope string                   `json:"update_scope" binding:"required,oneof=this_only future_only all"`
	Updates     UpdateReservationRequest `json:"updates"`
}

// AvailabilityCheckRequest represents a request to check availability
type AvailabilityCheckRequest struct {
	SpaceID              uuid.UUID  `json:"space_id" binding:"required"`
	StartTime            time.Time  `json:"start_time" binding:"required"`
	EndTime              time.Time  `json:"end_time" binding:"required"`
	ExcludeReservationID *uuid.UUID `json:"exclude_reservation_id,omitempty"`
	CheckCapacity        bool       `json:"check_capacity,omitempty"`
	RequiredParticipants *int       `json:"required_participants,omitempty"`
}

// BulkReservationRequest represents a request to create multiple reservations
type BulkReservationRequest struct {
	Reservations []CreateReservationRequest `json:"reservations" binding:"required,min=1,dive"`
	FailOnError  bool                       `json:"fail_on_error,omitempty"`
}

// ReservationStatsRequest represents a request for reservation statistics
type ReservationStatsRequest struct {
	StartDate      *time.Time  `json:"start_date,omitempty" form:"start_date"`
	EndDate        *time.Time  `json:"end_date,omitempty" form:"end_date"`
	Period         string      `json:"period,omitempty" form:"period" binding:"omitempty,oneof=day week month year"`
	UserID         *uuid.UUID  `json:"user_id,omitempty" form:"user_id"`
	SpaceID        *uuid.UUID  `json:"space_id,omitempty" form:"space_id"`
	SpaceIDs       []uuid.UUID `json:"space_ids,omitempty" form:"space_ids"`
	GroupBy        string      `json:"group_by,omitempty" form:"group_by" binding:"omitempty,oneof=user space date hour day_of_week"`
	IncludeNoShows bool        `json:"include_no_shows,omitempty" form:"include_no_shows"`
}

// SetDefaults sets default values for search request
func (r *ReservationSearchRequest) SetDefaults() {
	if r.Page == 0 {
		r.Page = 1
	}
	if r.Limit == 0 {
		r.Limit = 20
	}
	if r.SortBy == "" {
		r.SortBy = "start_time"
	}
	if r.SortOrder == "" {
		r.SortOrder = "asc"
	}
}

// GetOffset calculates the offset for pagination
func (r *ReservationSearchRequest) GetOffset() int {
	return (r.Page - 1) * r.Limit
}

// Validate validates the create reservation request
func (r *CreateReservationRequest) Validate() error {
	if r.StartTime.After(r.EndTime) {
		return errors.New("start time must be before end time")
	}

	if r.StartTime.Before(time.Now()) {
		return errors.New("start time must be in the future")
	}

	// Check minimum duration (15 minutes)
	if r.EndTime.Sub(r.StartTime) < 15*time.Minute {
		return errors.New("reservation must be at least 15 minutes long")
	}

	// Check maximum duration (12 hours)
	if r.EndTime.Sub(r.StartTime) > 12*time.Hour {
		return errors.New("reservation cannot exceed 12 hours")
	}

	// Validate recurrence pattern if recurring
	if r.IsRecurring {
		if r.RecurrencePattern == nil {
			return errors.New("recurrence pattern is required for recurring reservations")
		}

		if err := r.RecurrencePattern.Validate(); err != nil {
			return err
		}
	}

	return nil
}

// Validate validates the update reservation request
func (r *UpdateReservationRequest) Validate() error {
	if r.StartTime != nil && r.EndTime != nil {
		if r.StartTime.After(*r.EndTime) {
			return errors.New("start time must be before end time")
		}

		// Check minimum duration
		if r.EndTime.Sub(*r.StartTime) < 15*time.Minute {
			return errors.New("reservation must be at least 15 minutes long")
		}

		// Check maximum duration
		if r.EndTime.Sub(*r.StartTime) > 12*time.Hour {
			return errors.New("reservation cannot exceed 12 hours")
		}
	}

	return nil
}

// Validate validates the recurrence pattern
func (r *RecurrencePattern) Validate() error {
	if r.Type == "weekly" && len(r.DaysOfWeek) == 0 {
		return errors.New("days of week must be specified for weekly recurrence")
	}

	if r.EndDate != nil && r.MaxOccurrences != nil {
		return errors.New("cannot specify both end date and max occurrences")
	}

	if r.EndDate == nil && r.MaxOccurrences == nil {
		return errors.New("must specify either end date or max occurrences for recurrence")
	}

	if r.EndDate != nil && r.EndDate.Before(time.Now()) {
		return errors.New("recurrence end date must be in the future")
	}

	// Validate days of week
	for _, day := range r.DaysOfWeek {
		if day < 0 || day > 6 {
			return errors.New("days of week must be between 0 (Sunday) and 6 (Saturday)")
		}
	}

	return nil
}

// Validate validates the search request
func (r *ReservationSearchRequest) Validate() error {
	if r.MinParticipants != nil && r.MaxParticipants != nil && *r.MinParticipants > *r.MaxParticipants {
		return errors.New("min participants must be less than or equal to max participants")
	}

	if r.StartDate != nil && r.EndDate != nil && r.StartDate.After(*r.EndDate) {
		return errors.New("start date must be before end date")
	}

	return nil
}

// Validate validates the availability check request
func (r *AvailabilityCheckRequest) Validate() error {
	if r.StartTime.After(r.EndTime) {
		return errors.New("start time must be before end time")
	}

	if r.StartTime.Before(time.Now()) {
		return errors.New("start time must be in the future")
	}

	if r.EndTime.Sub(r.StartTime) < 15*time.Minute {
		return errors.New("time slot must be at least 15 minutes long")
	}

	return nil
}
