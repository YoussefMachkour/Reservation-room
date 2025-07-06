package dto

import (
	"time"

	"room-reservation-api/internal/models"

	"github.com/google/uuid"
)

/*

AUTH RESPONSES

*/

// Auth Responses
type AuthResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token"`
}

type RefreshTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresAt   int64  `json:"expires_at"`
}

// User Responses
type UserResponse struct {
	ID             uuid.UUID       `json:"id"`
	FirstName      string          `json:"first_name"`
	LastName       string          `json:"last_name"`
	Email          string          `json:"email"`
	Role           models.UserRole `json:"role"`
	IsActive       bool            `json:"is_active"`
	LastLoginAt    *time.Time      `json:"last_login_at"`
	Phone          string          `json:"phone"`
	ProfilePicture string          `json:"profile_picture"`
	Department     string          `json:"department"`
	Position       string          `json:"position"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type UsersListResponse struct {
	Users      []UserResponse `json:"users"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

// Conversion Functions
func ToUserResponse(user *models.User) UserResponse {
	return UserResponse{
		ID:             user.ID,
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		Email:          user.Email,
		Role:           user.Role,
		IsActive:       user.IsActive,
		LastLoginAt:    user.LastLoginAt,
		Phone:          user.Phone,
		ProfilePicture: user.ProfilePicture,
		Department:     user.Department,
		Position:       user.Position,
		CreatedAt:      user.CreatedAt,
		UpdatedAt:      user.UpdatedAt,
	}
}

func ToUsersListResponse(users []models.User, total int64, page, limit int) UsersListResponse {
	userResponses := make([]UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = ToUserResponse(&user)
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return UsersListResponse{
		Users:      userResponses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

func NewSuccessResponse(message string, data interface{}) SuccessResponse {
	return SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func NewPaginatedResponse(data interface{}, total int64, page, limit int) PaginatedResponse {
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return PaginatedResponse{
		Data: data,
		Pagination: PaginationMeta{
			TotalItems:   total,
			CurrentPage:  page,
			ItemsPerPage: limit,
			TotalPages:   totalPages,
			HasNextPage:  page < totalPages,
			HasPrevPage:  page > 1,
		},
	}
}

/*
SPACE RESPONSES
*/
type SpaceResponse struct {
	ID                 uuid.UUID     `json:"id"`
	Name               string        `json:"name"`
	Type               string        `json:"type"`
	Capacity           int           `json:"capacity"`
	Building           string        `json:"building"`
	Floor              int           `json:"floor"`
	RoomNumber         string        `json:"room_number"`
	Equipment          []Equipment   `json:"equipment"`
	Status             string        `json:"status"`
	Description        string        `json:"description"`
	Surface            float64       `json:"surface"`
	Photos             []string      `json:"photos"`
	PricePerHour       float64       `json:"price_per_hour"`
	PricePerDay        float64       `json:"price_per_day"`
	PricePerMonth      float64       `json:"price_per_month"`
	ManagerID          *uuid.UUID    `json:"manager_id"`
	Manager            *UserResponse `json:"manager,omitempty"`
	RequiresApproval   bool          `json:"requires_approval"`
	BookingAdvanceTime int           `json:"booking_advance_time"`
	MaxBookingDuration int           `json:"max_booking_duration"`
	FullLocation       string        `json:"full_location"`
	IsAvailable        bool          `json:"is_available"`
	CreatedAt          time.Time     `json:"created_at"`
	UpdatedAt          time.Time     `json:"updated_at"`
}

// SpaceListResponse represents the response for listing spaces
type SpaceListResponse struct {
	Spaces     []SpaceResponse `json:"spaces"`
	Pagination PaginationMeta  `json:"pagination"`
}

// SpaceDetailsResponse represents the detailed response for a single space
type SpaceDetailsResponse struct {
	*SpaceResponse
	RecentReservations   []ReservationSummary `json:"recent_reservations,omitempty"`
	UpcomingReservations []ReservationSummary `json:"upcoming_reservations,omitempty"`
	Statistics           *SpaceStatistics     `json:"statistics,omitempty"`
}

// SpaceAvailabilityResponse represents the response for space availability
type SpaceAvailabilityResponse struct {
	SpaceID       uuid.UUID             `json:"space_id"`
	SpaceName     string                `json:"space_name"`
	IsAvailable   bool                  `json:"is_available"`
	RequestedSlot TimeSlot              `json:"requested_slot"`
	Conflicts     []ReservationConflict `json:"conflicts,omitempty"`
	NextAvailable *TimeSlot             `json:"next_available,omitempty"`
	Suggestions   []AvailabilitySlot    `json:"suggestions,omitempty"`
}

// SpaceStatistics represents usage statistics for a space
type SpaceStatistics struct {
	TotalReservations      int             `json:"total_reservations"`
	ReservationsThisWeek   int             `json:"reservations_this_week"`
	ReservationsThisMonth  int             `json:"reservations_this_month"`
	UtilizationRate        float64         `json:"utilization_rate"`
	AverageBookingDuration int             `json:"average_booking_duration"`
	PopularTimeSlots       []TimeSlotStats `json:"popular_time_slots"`
	TopUsers               []UserStats     `json:"top_users"`
}

// TimeSlot represents a time slot
type TimeSlot struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

// AvailabilitySlot represents an available time slot
type AvailabilitySlot struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Duration  int       `json:"duration_minutes"`
}

// ReservationConflict represents a conflicting reservation
type ReservationConflict struct {
	ReservationID uuid.UUID `json:"reservation_id"`
	Title         string    `json:"title"`
	StartTime     time.Time `json:"start_time"`
	EndTime       time.Time `json:"end_time"`
	UserName      string    `json:"user_name"`
	Status        string    `json:"status"`
}

// ReservationSummary represents a summary of a reservation
type ReservationSummary struct {
	ID        uuid.UUID `json:"id"`
	Title     string    `json:"title"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	UserName  string    `json:"user_name"`
	Status    string    `json:"status"`
}

// TimeSlotStats represents statistics for a time slot
type TimeSlotStats struct {
	Hour         int `json:"hour"`
	Reservations int `json:"reservations"`
}

// UserStats represents user statistics
type UserStats struct {
	UserID       uuid.UUID `json:"user_id"`
	UserName     string    `json:"user_name"`
	Reservations int       `json:"reservations"`
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	CurrentPage  int   `json:"current_page"`
	TotalPages   int   `json:"total_pages"`
	TotalItems   int64 `json:"total_items"`
	ItemsPerPage int   `json:"items_per_page"`
	HasNextPage  bool  `json:"has_next_page"`
	HasPrevPage  bool  `json:"has_prev_page"`
}

// SpaceSearchResponse represents the response for space search
type SpaceSearchResponse struct {
	Spaces     []SpaceResponse `json:"spaces"`
	Filters    SearchFilters   `json:"filters"`
	Pagination PaginationMeta  `json:"pagination"`
}

// SearchFilters represents the applied filters
type SearchFilters struct {
	Types       []string `json:"types,omitempty"`
	Buildings   []string `json:"buildings,omitempty"`
	Floors      []int    `json:"floors,omitempty"`
	MinCapacity *int     `json:"min_capacity,omitempty"`
	MaxCapacity *int     `json:"max_capacity,omitempty"`
	Status      []string `json:"status,omitempty"`
	SortBy      string   `json:"sort_by"`
	SortOrder   string   `json:"sort_order"`
}

// SpaceOptionsResponse represents available options for space creation
type SpaceOptionsResponse struct {
	Types     []SpaceTypeOption   `json:"types"`
	Buildings []string            `json:"buildings"`
	Floors    []int               `json:"floors"`
	Statuses  []SpaceStatusOption `json:"statuses"`
	Equipment []string            `json:"equipment"`
	Managers  []ManagerOption     `json:"managers"`
}

// SpaceTypeOption represents a space type option
type SpaceTypeOption struct {
	Value       string `json:"value"`
	Label       string `json:"label"`
	Description string `json:"description"`
}

// SpaceStatusOption represents a space status option
type SpaceStatusOption struct {
	Value       string `json:"value"`
	Label       string `json:"label"`
	Description string `json:"description"`
}

// ManagerOption represents a manager option
type ManagerOption struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Role string    `json:"role"`
}

// BulkOperationResponse represents the response for bulk operations
type BulkOperationResponse struct {
	Success      []uuid.UUID          `json:"success"`
	Failed       []BulkOperationError `json:"failed"`
	TotalCount   int                  `json:"total_count"`
	SuccessCount int                  `json:"success_count"`
	FailedCount  int                  `json:"failed_count"`
}

// BulkOperationError represents an error in bulk operation
type BulkOperationError struct {
	SpaceID uuid.UUID `json:"space_id"`
	Error   string    `json:"error"`
}

// SpaceAnalyticsResponse represents space analytics data
type SpaceAnalyticsResponse struct {
	SpaceID           uuid.UUID           `json:"space_id"`
	SpaceName         string              `json:"space_name"`
	Period            string              `json:"period"`
	TotalReservations int                 `json:"total_reservations"`
	TotalHours        float64             `json:"total_hours"`
	UtilizationRate   float64             `json:"utilization_rate"`
	Revenue           float64             `json:"revenue"`
	PeakHours         []int               `json:"peak_hours"`
	DailyStats        []DailySpaceStats   `json:"daily_stats"`
	WeeklyStats       []WeeklySpaceStats  `json:"weekly_stats"`
	MonthlyStats      []MonthlySpaceStats `json:"monthly_stats"`
}

// DailySpaceStats represents daily statistics for a space
type DailySpaceStats struct {
	Date         time.Time `json:"date"`
	Reservations int       `json:"reservations"`
	Hours        float64   `json:"hours"`
	Revenue      float64   `json:"revenue"`
}

// WeeklySpaceStats represents weekly statistics for a space
type WeeklySpaceStats struct {
	Week         int     `json:"week"`
	Year         int     `json:"year"`
	Reservations int     `json:"reservations"`
	Hours        float64 `json:"hours"`
	Revenue      float64 `json:"revenue"`
}

// MonthlySpaceStats represents monthly statistics for a space
type MonthlySpaceStats struct {
	Month        int     `json:"month"`
	Year         int     `json:"year"`
	Reservations int     `json:"reservations"`
	Hours        float64 `json:"hours"`
	Revenue      float64 `json:"revenue"`
}

// MessageResponse represents a simple message response
type MessageResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

// NewSpaceResponse creates a new space response from a space model
func NewSpaceResponse(space interface{}) *SpaceResponse {
	// This would be implemented to convert from your Space model
	// Implementation depends on your exact model structure
	return &SpaceResponse{}
}

// NewSpaceListResponse creates a new space list response
func NewSpaceListResponse(spaces []SpaceResponse, pagination PaginationMeta) *SpaceListResponse {
	return &SpaceListResponse{
		Spaces:     spaces,
		Pagination: pagination,
	}
}

// NewPaginationMeta creates pagination metadata
func NewPaginationMeta(currentPage, totalItems int, itemsPerPage int) PaginationMeta {
	totalPages := (totalItems + itemsPerPage - 1) / itemsPerPage
	return PaginationMeta{
		CurrentPage:  currentPage,
		TotalPages:   totalPages,
		TotalItems:   int64(totalItems),
		ItemsPerPage: itemsPerPage,
		HasNextPage:  currentPage < totalPages,
		HasPrevPage:  currentPage > 1,
	}
}

// NewMessageResponse creates a simple message response
func NewMessageResponse(message string, success bool) *MessageResponse {
	return &MessageResponse{
		Message: message,
		Success: success,
	}
}
