// internal/repositories/interfaces/space_repository.go
package interfaces

import (
	"time"

	"room-reservation-api/internal/models"

	"github.com/google/uuid"
)

// SpaceRepositoryInterface defines the contract for space data operations
type SpaceRepositoryInterface interface {
	// ========================================
	// BASIC CRUD OPERATIONS
	// ========================================
	Create(space *models.Space) (*models.Space, error)
	GetByID(id uuid.UUID) (*models.Space, error)
	Update(id uuid.UUID, updates map[string]interface{}) (*models.Space, error)
	Delete(id uuid.UUID) error
	GetAll(offset, limit int) ([]*models.Space, int64, error)

	// ========================================
	// SEARCH AND FILTER OPERATIONS
	// ========================================
	SearchSpaces(filters SpaceFilters, offset, limit int) ([]*models.Space, int64, error)
	GetSpacesByBuilding(building string, offset, limit int) ([]*models.Space, int64, error)
	GetSpacesByType(spaceType string, offset, limit int) ([]*models.Space, int64, error)
	GetSpacesByStatus(status string, offset, limit int) ([]*models.Space, int64, error)
	GetSpacesByCapacityRange(minCapacity, maxCapacity int, offset, limit int) ([]*models.Space, int64, error)

	// ========================================
	// AVAILABILITY OPERATIONS
	// ========================================
	GetAvailableSpaces(startTime, endTime time.Time, offset, limit int) ([]*models.Space, int64, error)
	CheckSpaceAvailability(spaceID uuid.UUID, startTime, endTime time.Time) (bool, error)

	// ========================================
	// MANAGER OPERATIONS
	// ========================================
	GetSpacesByManager(managerID uuid.UUID, offset, limit int) ([]*models.Space, int64, error)

	// ========================================
	// UTILITY OPERATIONS
	// ========================================
	GetDistinctBuildings() ([]string, error)
	GetDistinctFloors() ([]int, error)
	ExistsByNameAndBuilding(name, building string) (bool, error)
	ExistsByNameAndBuildingExcluding(name, building string, excludeID uuid.UUID) (bool, error)

	// ========================================
	// SIMPLE COUNTS
	// ========================================
	CountSpaces() (int64, error)
	CountSpacesByStatus(status string) (int64, error)
	CountSpacesByBuilding(building string) (int64, error)
}

// SpaceFilters represents search filters (simplified for PFE)
type SpaceFilters struct {
	Types            []string   `json:"types,omitempty"`
	Buildings        []string   `json:"buildings,omitempty"`
	Floors           []int      `json:"floors,omitempty"`
	MinCapacity      *int       `json:"min_capacity,omitempty"`
	MaxCapacity      *int       `json:"max_capacity,omitempty"`
	Status           []string   `json:"status,omitempty"`
	SearchQuery      string     `json:"search_query,omitempty"` // Search in name/description
	RequiresApproval *bool      `json:"requires_approval,omitempty"`
	ManagerID        *uuid.UUID `json:"manager_id,omitempty"`
	AvailableStart   *time.Time `json:"available_start,omitempty"` // Check availability
	AvailableEnd     *time.Time `json:"available_end,omitempty"`
	SortBy           string     `json:"sort_by,omitempty"`    // name, capacity, created_at
	SortOrder        string     `json:"sort_order,omitempty"` // asc, desc
}
