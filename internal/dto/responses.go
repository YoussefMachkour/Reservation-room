package dto

import (
	"encoding/json"
	"fmt"
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

// BatchAvailabilityRequest represents a batch availability check request
type BatchAvailabilityRequest struct {
	SpaceIDs  []uuid.UUID `json:"space_ids" binding:"required,min=1,max=50"`
	StartTime time.Time   `json:"start_time" binding:"required"`
	EndTime   time.Time   `json:"end_time" binding:"required"`
}

// SpaceAvailabilityResult represents the result of an availability check
type SpaceAvailabilityResult struct {
	SpaceID       uuid.UUID `json:"space_id"`
	Available     bool      `json:"available"`
	Error         string    `json:"error,omitempty"`
	Conflicts     int       `json:"conflicts,omitempty"`
	NextAvailable *TimeSlot `json:"next_available,omitempty"`
}

// AssignManagerRequest represents a manager assignment request
type AssignManagerRequest struct {
	ManagerID uuid.UUID `json:"manager_id" binding:"required"`
}

// SpaceStatisticsResponse represents space statistics
type SpaceStatisticsResponse struct {
	SpaceID           uuid.UUID `json:"space_id"`
	TotalReservations int64     `json:"total_reservations"`
	Period            string    `json:"period"`
	GeneratedAt       time.Time `json:"generated_at"`
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

/*

RESERVATION RESPONSES

*/

// ReservationListResponse represents the response for listing reservations
type ReservationListResponse struct {
	Reservations []ReservationResponse `json:"reservations"`
	Pagination   PaginationMeta        `json:"pagination"`
	Summary      *ReservationSummary   `json:"summary,omitempty"`
}

// ReservationDetailsResponse represents detailed reservation information
type ReservationDetailsResponse struct {
	*ReservationResponse
	ConflictingReservations []ReservationConflict `json:"conflicting_reservations,omitempty"`
	SuggestedAlternatives   []AvailabilitySlot    `json:"suggested_alternatives,omitempty"`
	RelatedReservations     []ReservationSummary  `json:"related_reservations,omitempty"`
	CheckInHistory          []CheckInEvent        `json:"check_in_history,omitempty"`
	ModificationHistory     []ReservationChange   `json:"modification_history,omitempty"`
}

// UserSummaryResponse represents a summary of a user
type UserSummaryResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Avatar    string    `json:"avatar,omitempty"`
}

// SpaceSummaryResponse represents a summary of a space
type SpaceSummaryResponse struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Capacity     int       `json:"capacity"`
	Building     string    `json:"building"`
	Floor        int       `json:"floor"`
	RoomNumber   string    `json:"room_number"`
	FullLocation string    `json:"full_location"`
	Equipment    []string  `json:"equipment,omitempty"`
}

// CheckInEvent represents a check-in/check-out event
type CheckInEvent struct {
	Type      string    `json:"type"` // "check_in", "check_out", "no_show"
	Timestamp time.Time `json:"timestamp"`
	Notes     string    `json:"notes,omitempty"`
	UserID    uuid.UUID `json:"user_id"`
	UserName  string    `json:"user_name"`
}

// ReservationChange represents a change to a reservation
type ReservationChange struct {
	ID            uuid.UUID     `json:"id"`
	ReservationID uuid.UUID     `json:"reservation_id"`
	ChangedBy     uuid.UUID     `json:"changed_by"`
	ChangedByName string        `json:"changed_by_name"`
	ChangeType    string        `json:"change_type"` // "created", "updated", "cancelled", "approved", "rejected"
	Changes       []FieldChange `json:"changes"`
	Reason        string        `json:"reason,omitempty"`
	Timestamp     time.Time     `json:"timestamp"`
}

// FieldChange represents a change to a specific field
type FieldChange struct {
	Field    string      `json:"field"`
	OldValue interface{} `json:"old_value"`
	NewValue interface{} `json:"new_value"`
}

// AvailabilityResponse represents space availability information
type AvailabilityResponse struct {
	SpaceID       uuid.UUID             `json:"space_id"`
	SpaceName     string                `json:"space_name"`
	IsAvailable   bool                  `json:"is_available"`
	RequestedSlot TimeSlot              `json:"requested_slot"`
	Conflicts     []ReservationConflict `json:"conflicts,omitempty"`
	NextAvailable *TimeSlot             `json:"next_available,omitempty"`
	Suggestions   []AvailabilitySlot    `json:"suggestions,omitempty"`
	CapacityCheck *CapacityCheckResult  `json:"capacity_check,omitempty"`
}

// CapacityCheckResult represents capacity validation result
type CapacityCheckResult struct {
	SpaceCapacity         int  `json:"space_capacity"`
	RequestedParticipants int  `json:"requested_participants"`
	IsWithinCapacity      bool `json:"is_within_capacity"`
	OvercapacityBy        int  `json:"overcapacity_by,omitempty"`
}

// ApprovalResponse represents approval/rejection response
type ApprovalResponse struct {
	ReservationID uuid.UUID `json:"reservation_id"`
	Action        string    `json:"action"` // "approved", "rejected"
	ApproverID    uuid.UUID `json:"approver_id"`
	ApproverName  string    `json:"approver_name"`
	Comments      string    `json:"comments,omitempty"`
	Timestamp     time.Time `json:"timestamp"`
}

// BulkApprovalResponse represents bulk approval/rejection response
type BulkApprovalResponse struct {
	Success      []ApprovalResult     `json:"success"`
	Failed       []BulkOperationError `json:"failed"`
	TotalCount   int                  `json:"total_count"`
	SuccessCount int                  `json:"success_count"`
	FailedCount  int                  `json:"failed_count"`
}

// ApprovalResult represents a single approval result
type ApprovalResult struct {
	ReservationID uuid.UUID `json:"reservation_id"`
	Action        string    `json:"action"`
	Status        string    `json:"new_status"`
}

// ReservationStatsResponse represents reservation statistics
type ReservationStatsResponse struct {
	Period            string                    `json:"period"`
	StartDate         time.Time                 `json:"start_date"`
	EndDate           time.Time                 `json:"end_date"`
	TotalReservations int                       `json:"total_reservations"`
	TotalHours        float64                   `json:"total_hours"`
	AverageHours      float64                   `json:"average_hours"`
	Revenue           float64                   `json:"revenue"`
	CancellationRate  float64                   `json:"cancellation_rate"`
	NoShowRate        float64                   `json:"no_show_rate"`
	ApprovalRate      float64                   `json:"approval_rate"`
	UtilizationRate   float64                   `json:"utilization_rate"`
	PeakHours         []int                     `json:"peak_hours"`
	PeakDays          []string                  `json:"peak_days"`
	StatusBreakdown   map[string]int            `json:"status_breakdown"`
	SpaceStats        []SpaceReservationStats   `json:"space_stats,omitempty"`
	UserStats         []UserReservationStats    `json:"user_stats,omitempty"`
	DailyStats        []DailyReservationStats   `json:"daily_stats,omitempty"`
	WeeklyStats       []WeeklyReservationStats  `json:"weekly_stats,omitempty"`
	MonthlyStats      []MonthlyReservationStats `json:"monthly_stats,omitempty"`
}

// SpaceReservationStats represents space-specific reservation statistics
type SpaceReservationStats struct {
	SpaceID           uuid.UUID `json:"space_id"`
	SpaceName         string    `json:"space_name"`
	TotalReservations int       `json:"total_reservations"`
	TotalHours        float64   `json:"total_hours"`
	UtilizationRate   float64   `json:"utilization_rate"`
	Revenue           float64   `json:"revenue"`
	AverageDuration   float64   `json:"average_duration"`
	CancellationRate  float64   `json:"cancellation_rate"`
	NoShowRate        float64   `json:"no_show_rate"`
}

// UserReservationStats represents user-specific reservation statistics
type UserReservationStats struct {
	UserID             uuid.UUID        `json:"user_id"`
	UserName           string           `json:"user_name"`
	TotalReservations  int              `json:"total_reservations"`
	TotalHours         float64          `json:"total_hours"`
	CancelledCount     int              `json:"cancelled_count"`
	NoShowCount        int              `json:"no_show_count"`
	FavoriteSpaces     []SpaceUsageData `json:"favorite_spaces"`
	PreferredTimeSlots []TimeSlotUsage  `json:"preferred_time_slots"`
	AverageDuration    float64          `json:"average_duration"`
}

// Add these structs to your dto package

// RejectionRequest represents a request to reject a reservation
type RejectionRequest struct {
	Reason string `json:"reason" binding:"required" example:"Space not available due to maintenance"`
}

// UpdateSpaceStatusRequest represents a request to update space status
type UpdateSpaceStatusRequest struct {
	Status string `json:"status" binding:"required" example:"maintenance"`
	Reason string `json:"reason,omitempty" example:"Scheduled maintenance work"`
}

// SpaceReservationsResponse represents the response for space reservations
type SpaceReservationsResponse struct {
	SpaceID      uuid.UUID              `json:"space_id"`
	SpaceName    string                 `json:"space_name"`
	Reservations []*ReservationResponse `json:"reservations"`
	TotalCount   int                    `json:"total_count"`
	DateRange    DateRangeInfo          `json:"date_range"`
	Summary      ReservationSummary     `json:"summary"`
}

// DateRangeInfo represents date range information
type DateRangeInfo struct {
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	Days      int       `json:"days"`
}

// ReservationSummary represents summary statistics for reservations
type ReservationSummary struct {
	TotalReservations int            `json:"total_reservations"`
	StatusBreakdown   map[string]int `json:"status_breakdown"`
	AveragePerDay     float64        `json:"average_per_day"`
	PeakDays          []string       `json:"peak_days,omitempty"`
}

// PendingApprovalsResponse represents the response for pending approvals
type PendingApprovalsResponse struct {
	Reservations []*ReservationResponse `json:"reservations"`
	TotalPending int64                  `json:"total_pending"`
	Summary      ApprovalSummary        `json:"summary"`
}

// ApprovalSummary represents summary information for pending approvals
type ApprovalSummary struct {
	TotalPending  int64          `json:"total_pending"`
	BySpace       map[string]int `json:"by_space"`
	ByRequestDate map[string]int `json:"by_request_date"`
	UrgentCount   int            `json:"urgent_count"` // reservations starting within 24 hours
}

// ReservationResponse represents a reservation in API responses
type ReservationResponse struct {
	ID                 uuid.UUID  `json:"id"`
	UserID             uuid.UUID  `json:"user_id"`
	SpaceID            uuid.UUID  `json:"space_id"`
	StartTime          time.Time  `json:"start_time"`
	EndTime            time.Time  `json:"end_time"`
	ParticipantCount   int        `json:"participant_count"`
	Title              string     `json:"title"`
	Description        string     `json:"description,omitempty"`
	Status             string     `json:"status"`
	CheckInTime        *time.Time `json:"check_in_time,omitempty"`
	CheckOutTime       *time.Time `json:"check_out_time,omitempty"`
	ApprovedBy         *uuid.UUID `json:"approved_by,omitempty"`
	ApprovedAt         *time.Time `json:"approved_at,omitempty"`
	RejectedBy         *uuid.UUID `json:"rejected_by,omitempty"`
	RejectedAt         *time.Time `json:"rejected_at,omitempty"`
	RejectionReason    string     `json:"rejection_reason,omitempty"`
	CancellationReason string     `json:"cancellation_reason,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`

	// Related entities (optional, include based on needs)
	User  *UserResponse  `json:"user,omitempty"`
	Space *SpaceResponse `json:"space,omitempty"`

	// Computed fields
	Duration    string `json:"duration"` // e.g., "2h 30m"
	CanModify   bool   `json:"can_modify"`
	CanCancel   bool   `json:"can_cancel"`
	CanCheckIn  bool   `json:"can_check_in"`
	CanCheckOut bool   `json:"can_check_out"`
}

// ToReservationResponse converts a reservation model to response DTO
func ToReservationResponse(reservation *models.Reservation) *ReservationResponse {
	response := &ReservationResponse{
		ID:                 reservation.ID,
		UserID:             reservation.UserID,
		SpaceID:            reservation.SpaceID,
		StartTime:          reservation.StartTime,
		EndTime:            reservation.EndTime,
		ParticipantCount:   reservation.ParticipantCount,
		Title:              reservation.Title,
		Description:        reservation.Description,
		Status:             string(reservation.Status),
		CheckInTime:        reservation.CheckInTime,
		CheckOutTime:       reservation.CheckOutTime,
		CancellationReason: reservation.CancellationReason,
		CreatedAt:          reservation.CreatedAt,
		UpdatedAt:          reservation.UpdatedAt,
		Duration:           formatDuration(reservation.EndTime.Sub(reservation.StartTime)),
		CanModify:          reservation.CanBeModified(),
		CanCancel:          reservation.CanBeCancelled(),
		CanCheckIn:         canCheckInNow(reservation),
		CanCheckOut:        canCheckOutNow(reservation),
	}

	return response
}

// Helper functions for computed fields
func formatDuration(duration time.Duration) string {
	hours := int(duration.Hours())
	minutes := int(duration.Minutes()) % 60

	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}

func canCheckInNow(reservation *models.Reservation) bool {
	if reservation.Status != models.StatusConfirmed {
		return false
	}
	if reservation.CheckInTime != nil {
		return false // Already checked in
	}

	now := time.Now()
	// Can check in 15 minutes before start time until end time
	return now.After(reservation.StartTime.Add(-15*time.Minute)) && now.Before(reservation.EndTime)
}

func canCheckOutNow(reservation *models.Reservation) bool {
	return reservation.CheckInTime != nil && reservation.CheckOutTime == nil
}

// ToSpaceResponse converts a space model to response DTO
func ToSpaceResponse(space *models.Space) *SpaceResponse {
	response := &SpaceResponse{
		ID:          space.ID,
		Name:        space.Name,
		Type:        string(space.Type),
		Capacity:    space.Capacity,
		Building:    space.Building,
		Floor:       space.Floor,
		RoomNumber:  space.RoomNumber,
		Status:      string(space.Status),
		Description: space.Description,
		CreatedAt:   space.CreatedAt,
		UpdatedAt:   space.UpdatedAt,
	}

	// Parse photos JSON if present
	if space.Photos != nil {
		var photos []string
		if err := json.Unmarshal(space.Photos, &photos); err == nil {
			response.Photos = photos
		}
	}

	return response
}

// SpaceUsageData represents space usage statistics
type SpaceUsageData struct {
	SpaceID    uuid.UUID `json:"space_id"`
	SpaceName  string    `json:"space_name"`
	UsageCount int       `json:"usage_count"`
	TotalHours float64   `json:"total_hours"`
	Percentage float64   `json:"percentage"`
}

// TimeSlotUsage represents time slot usage statistics
type TimeSlotUsage struct {
	Hour       int     `json:"hour"`
	DayOfWeek  string  `json:"day_of_week,omitempty"`
	UsageCount int     `json:"usage_count"`
	Percentage float64 `json:"percentage"`
}

// DailyReservationStats represents daily reservation statistics
type DailyReservationStats struct {
	Date         time.Time `json:"date"`
	Reservations int       `json:"reservations"`
	Hours        float64   `json:"hours"`
	Revenue      float64   `json:"revenue"`
	Utilization  float64   `json:"utilization"`
}

// WeeklyReservationStats represents weekly reservation statistics
type WeeklyReservationStats struct {
	Week         int     `json:"week"`
	Year         int     `json:"year"`
	Reservations int     `json:"reservations"`
	Hours        float64 `json:"hours"`
	Revenue      float64 `json:"revenue"`
	Utilization  float64 `json:"utilization"`
}

// MonthlyReservationStats represents monthly reservation statistics
type MonthlyReservationStats struct {
	Month        int     `json:"month"`
	Year         int     `json:"year"`
	Reservations int     `json:"reservations"`
	Hours        float64 `json:"hours"`
	Revenue      float64 `json:"revenue"`
	Utilization  float64 `json:"utilization"`
}

// RecurringSeriesResponse represents a recurring reservation series
type RecurringSeriesResponse struct {
	ParentID         uuid.UUID            `json:"parent_id"`
	Pattern          RecurrencePattern    `json:"pattern"`
	TotalOccurrences int                  `json:"total_occurrences"`
	CompletedCount   int                  `json:"completed_count"`
	UpcomingCount    int                  `json:"upcoming_count"`
	CancelledCount   int                  `json:"cancelled_count"`
	NextOccurrence   *time.Time           `json:"next_occurrence,omitempty"`
	LastOccurrence   *time.Time           `json:"last_occurrence,omitempty"`
	Reservations     []ReservationSummary `json:"reservations"`
}

// CheckInResponse represents check-in/check-out response
type CheckInResponse struct {
	ReservationID uuid.UUID `json:"reservation_id"`
	Action        string    `json:"action"` // "checked_in", "checked_out"
	Timestamp     time.Time `json:"timestamp"`
	Notes         string    `json:"notes,omitempty"`
	Duration      *string   `json:"duration,omitempty"` // For check-out
	Rating        *int      `json:"rating,omitempty"`
	Feedback      string    `json:"feedback,omitempty"`
}

// NoShowResponse represents no-show report response
type NoShowResponse struct {
	ReservationID uuid.UUID `json:"reservation_id"`
	ReportedBy    string    `json:"reported_by"`
	Reason        string    `json:"reason"`
	ReportedTime  time.Time `json:"reported_time"`
	Action        string    `json:"action"` // "marked_no_show"
}

// ReservationSearchResponse represents search results
type ReservationSearchResponse struct {
	Reservations []ReservationResponse `json:"reservations"`
	Filters      SearchFilters         `json:"filters"`
	Pagination   PaginationMeta        `json:"pagination"`
	Summary      *SearchSummary        `json:"summary,omitempty"`
}

// SearchSummary represents search result summary
type SearchSummary struct {
	TotalFound      int            `json:"total_found"`
	StatusCounts    map[string]int `json:"status_counts"`
	SpaceCounts     map[string]int `json:"space_counts"`
	DateRange       *DateRange     `json:"date_range,omitempty"`
	TotalHours      float64        `json:"total_hours"`
	AverageDuration float64        `json:"average_duration"`
}

// DateRange represents a date range
type DateRange struct {
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	Duration  string    `json:"duration"`
}

// ReservationCalendarResponse represents calendar view data
type ReservationCalendarResponse struct {
	Date         time.Time              `json:"date"`
	Reservations []ReservationSummary   `json:"reservations"`
	Summary      *DayReservationSummary `json:"summary"`
}

// DayReservationSummary represents daily reservation summary
type DayReservationSummary struct {
	Date              time.Time      `json:"date"`
	TotalReservations int            `json:"total_reservations"`
	TotalHours        float64        `json:"total_hours"`
	StatusBreakdown   map[string]int `json:"status_breakdown"`
	PeakHours         []int          `json:"peak_hours"`
	BusiestSpace      *SpaceSummary  `json:"busiest_space,omitempty"`
}

// SpaceSummary represents a space summary for calendar
type SpaceSummary struct {
	SpaceID      uuid.UUID `json:"space_id"`
	SpaceName    string    `json:"space_name"`
	Reservations int       `json:"reservations"`
	Hours        float64   `json:"hours"`
}

// NewReservationResponse creates a new reservation response
func NewReservationResponse(reservation interface{}) *ReservationResponse {
	// Implementation would convert from models.Reservation
	return &ReservationResponse{}
}

// NewReservationListResponse creates a new reservation list response
func NewReservationListResponse(reservations []ReservationResponse, pagination PaginationMeta) *ReservationListResponse {
	return &ReservationListResponse{
		Reservations: reservations,
		Pagination:   pagination,
	}
}

// NewApprovalResponse creates an approval response
func NewApprovalResponse(reservationID, approverID uuid.UUID, action, approverName, comments string) *ApprovalResponse {
	return &ApprovalResponse{
		ReservationID: reservationID,
		Action:        action,
		ApproverID:    approverID,
		ApproverName:  approverName,
		Comments:      comments,
		Timestamp:     time.Now(),
	}
}
