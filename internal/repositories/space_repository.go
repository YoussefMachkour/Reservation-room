// internal/repositories/space_repository.go
package repositories

import (
	"fmt"
	"strings"
	"time"

	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SpaceRepository implements the SpaceRepositoryInterface
type SpaceRepository struct {
	db *gorm.DB
}

// NewSpaceRepository creates a new space repository
func NewSpaceRepository(db *gorm.DB) interfaces.SpaceRepositoryInterface {
	return &SpaceRepository{db: db}
}

// ========================================
// BASIC CRUD OPERATIONS
// ========================================

// Create creates a new space
func (r *SpaceRepository) Create(space *models.Space) (*models.Space, error) {
	if err := r.db.Create(space).Error; err != nil {
		return nil, err
	}

	// Fetch the created space with relationships
	return r.GetByID(space.ID)
}

// GetByID retrieves a space by ID with relationships
func (r *SpaceRepository) GetByID(id uuid.UUID) (*models.Space, error) {
	var space models.Space
	err := r.db.Preload("Manager").Where("id = ?", id).First(&space).Error
	if err != nil {
		return nil, err
	}
	return &space, nil
}

// Update updates a space
func (r *SpaceRepository) Update(id uuid.UUID, updates map[string]interface{}) (*models.Space, error) {
	if err := r.db.Model(&models.Space{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Return updated space
	return r.GetByID(id)
}

// Delete soft deletes a space
func (r *SpaceRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Space{}, "id = ?", id).Error
}

// GetAll retrieves all spaces with pagination
func (r *SpaceRepository) GetAll(offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Count total
	if err := r.db.Model(&models.Space{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces with pagination
	err := r.db.Preload("Manager").
		Order("name ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// ========================================
// SEARCH AND FILTER OPERATIONS
// ========================================

// SearchSpaces searches spaces with multiple filters
func (r *SpaceRepository) SearchSpaces(filters interfaces.SpaceFilters, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Build the base query
	query := r.db.Model(&models.Space{})

	// Apply filters
	query = r.applyFilters(query, filters)

	// Count total with filters
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	query = r.applySorting(query, filters.SortBy, filters.SortOrder)

	// Get results with pagination
	err := query.Preload("Manager").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// GetSpacesByBuilding retrieves spaces in a specific building
func (r *SpaceRepository) GetSpacesByBuilding(building string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Count total
	if err := r.db.Model(&models.Space{}).Where("building = ?", building).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces
	err := r.db.Preload("Manager").
		Where("building = ?", building).
		Order("floor ASC, room_number ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// GetSpacesByType retrieves spaces of a specific type
func (r *SpaceRepository) GetSpacesByType(spaceType string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Count total
	if err := r.db.Model(&models.Space{}).Where("type = ?", spaceType).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces
	err := r.db.Preload("Manager").
		Where("type = ?", spaceType).
		Order("name ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// GetSpacesByStatus retrieves spaces with a specific status
func (r *SpaceRepository) GetSpacesByStatus(status string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Count total
	if err := r.db.Model(&models.Space{}).Where("status = ?", status).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces
	err := r.db.Preload("Manager").
		Where("status = ?", status).
		Order("name ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// GetSpacesByCapacityRange retrieves spaces within a capacity range
func (r *SpaceRepository) GetSpacesByCapacityRange(minCapacity, maxCapacity int, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{})

	// Apply capacity filters
	if minCapacity > 0 {
		query = query.Where("capacity >= ?", minCapacity)
	}
	if maxCapacity > 0 {
		query = query.Where("capacity <= ?", maxCapacity)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces
	err := query.Preload("Manager").
		Order("capacity ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// ========================================
// AVAILABILITY OPERATIONS
// ========================================

// GetAvailableSpaces retrieves spaces available during a specific time period
func (r *SpaceRepository) GetAvailableSpaces(startTime, endTime time.Time, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Subquery to find spaces that have conflicting reservations
	conflictingSpaces := r.db.Table("reservations").
		Select("DISTINCT space_id").
		Where("status IN ? AND start_time < ? AND end_time > ?",
			[]string{"confirmed", "pending"}, endTime, startTime)

	// Query for available spaces (not in conflicting list and status = available)
	query := r.db.Model(&models.Space{}).
		Where("status = ? AND id NOT IN (?)", "available", conflictingSpaces)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces
	err := query.Preload("Manager").
		Order("name ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// CheckSpaceAvailability checks if a specific space is available during a time period
func (r *SpaceRepository) CheckSpaceAvailability(spaceID uuid.UUID, startTime, endTime time.Time) (bool, error) {
	// First check if space exists and is available status
	var space models.Space
	if err := r.db.Where("id = ? AND status = ?", spaceID, "available").First(&space).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil // Space doesn't exist or not available
		}
		return false, err
	}

	// Check for conflicting reservations
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("space_id = ? AND status IN ? AND start_time < ? AND end_time > ?",
			spaceID, []string{"confirmed", "pending"}, endTime, startTime).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count == 0, nil
}

// ========================================
// MANAGER OPERATIONS
// ========================================

// GetSpacesByManager retrieves spaces managed by a specific manager
func (r *SpaceRepository) GetSpacesByManager(managerID uuid.UUID, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Count total
	if err := r.db.Model(&models.Space{}).Where("manager_id = ?", managerID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get spaces
	err := r.db.Preload("Manager").
		Where("manager_id = ?", managerID).
		Order("building ASC, floor ASC, room_number ASC").
		Offset(offset).Limit(limit).
		Find(&spaces).Error

	return spaces, total, err
}

// ========================================
// UTILITY OPERATIONS
// ========================================

// GetDistinctBuildings retrieves all unique building names
func (r *SpaceRepository) GetDistinctBuildings() ([]string, error) {
	var buildings []string
	err := r.db.Model(&models.Space{}).
		Distinct("building").
		Order("building ASC").
		Pluck("building", &buildings).Error

	return buildings, err
}

// GetDistinctFloors retrieves all unique floor numbers
func (r *SpaceRepository) GetDistinctFloors() ([]int, error) {
	var floors []int
	err := r.db.Model(&models.Space{}).
		Distinct("floor").
		Order("floor ASC").
		Pluck("floor", &floors).Error

	return floors, err
}

// ExistsByNameAndBuilding checks if a space with the same name exists in the same building
func (r *SpaceRepository) ExistsByNameAndBuilding(name, building string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Space{}).
		Where("name = ? AND building = ?", name, building).
		Count(&count).Error

	return count > 0, err
}

// ExistsByNameAndBuildingExcluding checks if a space with the same name exists in the same building, excluding a specific space
func (r *SpaceRepository) ExistsByNameAndBuildingExcluding(name, building string, excludeID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Space{}).
		Where("name = ? AND building = ? AND id != ?", name, building, excludeID).
		Count(&count).Error

	return count > 0, err
}

// ========================================
// SIMPLE COUNTS
// ========================================

// CountSpaces counts total number of spaces
func (r *SpaceRepository) CountSpaces() (int64, error) {
	var count int64
	err := r.db.Model(&models.Space{}).Count(&count).Error
	return count, err
}

// CountSpacesByStatus counts spaces by status
func (r *SpaceRepository) CountSpacesByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Space{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

// CountSpacesByBuilding counts spaces in a specific building
func (r *SpaceRepository) CountSpacesByBuilding(building string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Space{}).Where("building = ?", building).Count(&count).Error
	return count, err
}

// ========================================
// HELPER METHODS
// ========================================

// applyFilters applies search filters to the query
func (r *SpaceRepository) applyFilters(query *gorm.DB, filters interfaces.SpaceFilters) *gorm.DB {
	// Filter by types
	if len(filters.Types) > 0 {
		query = query.Where("type IN ?", filters.Types)
	}

	// Filter by buildings
	if len(filters.Buildings) > 0 {
		query = query.Where("building IN ?", filters.Buildings)
	}

	// Filter by floors
	if len(filters.Floors) > 0 {
		query = query.Where("floor IN ?", filters.Floors)
	}

	// Filter by capacity range
	if filters.MinCapacity != nil && *filters.MinCapacity > 0 {
		query = query.Where("capacity >= ?", *filters.MinCapacity)
	}
	if filters.MaxCapacity != nil && *filters.MaxCapacity > 0 {
		query = query.Where("capacity <= ?", *filters.MaxCapacity)
	}

	// Filter by status
	if len(filters.Status) > 0 {
		query = query.Where("status IN ?", filters.Status)
	}

	// Filter by approval requirement
	if filters.RequiresApproval != nil {
		query = query.Where("requires_approval = ?", *filters.RequiresApproval)
	}

	// Filter by manager
	if filters.ManagerID != nil {
		query = query.Where("manager_id = ?", *filters.ManagerID)
	}

	// Search in name and description
	if filters.SearchQuery != "" {
		searchPattern := "%" + strings.ToLower(filters.SearchQuery) + "%"
		query = query.Where(
			"LOWER(name) LIKE ? OR LOWER(description) LIKE ?",
			searchPattern, searchPattern,
		)
	}

	// Filter by availability (if both start and end times are provided)
	if filters.AvailableStart != nil && filters.AvailableEnd != nil {
		// Exclude spaces that have conflicting reservations
		conflictingSpaces := r.db.Table("reservations").
			Select("DISTINCT space_id").
			Where("status IN ? AND start_time < ? AND end_time > ?",
				[]string{"confirmed", "pending"}, *filters.AvailableEnd, *filters.AvailableStart)

		query = query.Where("id NOT IN (?)", conflictingSpaces)
	}

	return query
}

// applySorting applies sorting to the query
func (r *SpaceRepository) applySorting(query *gorm.DB, sortBy, sortOrder string) *gorm.DB {
	// Default sorting
	if sortBy == "" {
		sortBy = "name"
	}
	if sortOrder == "" {
		sortOrder = "asc"
	}

	// Validate sort fields
	validSortFields := map[string]bool{
		"name":       true,
		"capacity":   true,
		"building":   true,
		"floor":      true,
		"type":       true,
		"status":     true,
		"created_at": true,
	}

	if !validSortFields[sortBy] {
		sortBy = "name"
	}

	// Validate sort order
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc"
	}

	orderClause := fmt.Sprintf("%s %s", sortBy, strings.ToUpper(sortOrder))
	return query.Order(orderClause)
}
