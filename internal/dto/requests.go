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
