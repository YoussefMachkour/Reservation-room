// internal/repositories/interfaces/space_repository.go
package interfaces

import (
	"time"

	"room-reservation-api/internal/models"

	"github.com/google/uuid"
)

// SpaceRepositoryInterface defines the contract for space data operations
type SpaceRepositoryInterface interface {
	// Basic CRUD operations
	Create(space *models.Space) (*models.Space, error)
	GetByID(id uuid.UUID) (*models.Space, error)
	Update(id uuid.UUID, updates map[string]interface{}) (*models.Space, error)
	Delete(id uuid.UUID) error

	// List and search operations
	GetAll(offset, limit int) ([]*models.Space, int64, error)
	GetSpacesWithFilters(filters map[string]interface{}, offset, limit int) ([]*models.Space, int64, error)
	SearchSpaces(filters map[string]interface{}, offset, limit int) ([]*models.Space, int64, error)

	// Existence checks
	ExistsByNameAndBuilding(name, building string) (bool, error)
	ExistsByNameAndBuildingExcluding(name, building string, excludeID uuid.UUID) (bool, error)

	// Building and location operations
	GetDistinctBuildings() ([]string, error)
	GetDistinctFloors() ([]int, error)
	GetSpacesByBuilding(building string, offset, limit int) ([]*models.Space, int64, error)
	GetSpacesByBuildingAndFloor(building string, floor int, offset, limit int) ([]*models.Space, int64, error)

	// Equipment operations
	GetDistinctEquipment() ([]string, error)
	GetSpacesByEquipment(equipment []string, offset, limit int) ([]*models.Space, int64, error)

	// Manager operations
	GetSpacesByManager(managerID uuid.UUID, offset, limit int) ([]*models.Space, int64, error)

	// Status operations
	GetSpacesByStatus(status string, offset, limit int) ([]*models.Space, int64, error)
	BulkUpdateStatus(spaceIDs []uuid.UUID, status string) error

	// Capacity operations
	GetSpacesByCapacityRange(minCapacity, maxCapacity int, offset, limit int) ([]*models.Space, int64, error)

	// Availability operations
	GetAvailableSpaces(startTime, endTime time.Time, offset, limit int) ([]*models.Space, int64, error)
	CheckSpaceAvailability(spaceID uuid.UUID, startTime, endTime time.Time) (bool, error)

	// Analytics operations
	GetPopularSpaces(limit int) ([]*models.Space, error)
	GetLeastUsedSpaces(limit int) ([]*models.Space, error)

	// Pricing operations
	GetSpacesByPriceRange(minPrice, maxPrice float64, priceType string, offset, limit int) ([]*models.Space, int64, error)

	// Advanced search operations
	SearchSpacesByName(query string, offset, limit int) ([]*models.Space, int64, error)
	SearchSpacesByDescription(query string, offset, limit int) ([]*models.Space, int64, error)
	GetSpacesWithMultipleFilters(filters SpaceFilters, offset, limit int) ([]*models.Space, int64, error)

	// Batch operations
	CreateBatch(spaces []*models.Space) ([]*models.Space, error)
	UpdateBatch(updates []SpaceUpdate) error
	DeleteBatch(spaceIDs []uuid.UUID) error

	// Relationship operations
	GetSpaceWithManager(spaceID uuid.UUID) (*models.Space, error)
	GetSpaceWithReservations(spaceID uuid.UUID) (*models.Space, error)
	GetSpaceWithAll(spaceID uuid.UUID) (*models.Space, error)

	// Count operations
	CountSpaces() (int64, error)
	CountSpacesByStatus(status string) (int64, error)
	CountSpacesByBuilding(building string) (int64, error)
	CountSpacesByType(spaceType string) (int64, error)
}

// SpaceFilters represents advanced search filters
type SpaceFilters struct {
	Types              []string
	Buildings          []string
	Floors             []int
	MinCapacity        *int
	MaxCapacity        *int
	Status             []string
	RequiredEquipment  []string
	RequiresApproval   *bool
	MinPricePerHour    *float64
	MaxPricePerHour    *float64
	MinPricePerDay     *float64
	MaxPricePerDay     *float64
	MinPricePerMonth   *float64
	MaxPricePerMonth   *float64
	ManagerIDs         []uuid.UUID
	AvailableStartTime *time.Time
	AvailableEndTime   *time.Time
	SearchQuery        string
	SortBy             string
	SortOrder          string
}

// SpaceUpdate represents a space update operation
type SpaceUpdate struct {
	SpaceID uuid.UUID
	Updates map[string]interface{}
}

// SpaceAnalytics represents analytics data for a space
type SpaceAnalytics struct {
	SpaceID                uuid.UUID
	TotalReservations      int
	TotalHours             float64
	UtilizationRate        float64
	Revenue                float64
	AverageBookingDuration float64
	PeakHours              []int
	DailyStats             []DailyStats
	WeeklyStats            []WeeklyStats
	MonthlyStats           []MonthlyStats
	TopUsers               []UserUsageStats
}

// UtilizationStats represents utilization statistics
type UtilizationStats struct {
	SpaceID         uuid.UUID
	Period          string
	TotalHours      float64
	BookedHours     float64
	UtilizationRate float64
	PeakDays        []time.Weekday
	PeakHours       []int
}

// DailyStats represents daily usage statistics
type DailyStats struct {
	Date         time.Time
	Reservations int
	Hours        float64
	Revenue      float64
}

// WeeklyStats represents weekly usage statistics
type WeeklyStats struct {
	Week         int
	Year         int
	Reservations int
	Hours        float64
	Revenue      float64
}

// MonthlyStats represents monthly usage statistics
type MonthlyStats struct {
	Month        int
	Year         int
	Reservations int
	Hours        float64
	Revenue      float64
}

// UserUsageStats represents user usage statistics
type UserUsageStats struct {
	UserID       uuid.UUID
	UserName     string
	Reservations int
	TotalHours   float64
	Revenue      float64
}

// ReservationRepositoryInterface defines methods needed by space service for reservation operations
type ReservationRepositoryInterface interface {
	// Conflict checking
	GetConflictingReservations(spaceID uuid.UUID, startTime, endTime time.Time) ([]*models.Reservation, error)
	HasActiveReservationsForSpace(spaceID uuid.UUID) (bool, error)

	// Space utilization
	GetSpaceReservationCount(spaceID uuid.UUID, startDate, endDate time.Time) (int, error)
	GetSpaceReservationHours(spaceID uuid.UUID, startDate, endDate time.Time) (float64, error)

	// Analytics support
	GetReservationStatsForSpace(spaceID uuid.UUID, startDate, endDate time.Time) (*ReservationStats, error)
}

// ReservationStats represents reservation statistics
type ReservationStats struct {
	TotalReservations int
	TotalHours        float64
	AverageHours      float64
	Revenue           float64
	CancellationRate  float64
}
