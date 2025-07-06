// internal/repositories/space_repository.go
package repositories

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"
)

type SpaceRepository struct {
	db *gorm.DB
}

// NewSpaceRepository creates a new space repository
func NewSpaceRepository(db *gorm.DB) interfaces.SpaceRepositoryInterface {
	return &SpaceRepository{
		db: db,
	}
}

// Basic CRUD Operations

// Create creates a new space
func (r *SpaceRepository) Create(space *models.Space) (*models.Space, error) {
	if err := r.db.Create(space).Error; err != nil {
		return nil, fmt.Errorf("failed to create space: %w", err)
	}

	// Load the space with relations
	return r.GetByID(space.ID)
}

// GetByID retrieves a space by its ID
func (r *SpaceRepository) GetByID(id uuid.UUID) (*models.Space, error) {
	var space models.Space

	err := r.db.Preload("Manager").
		Where("id = ?", id).
		First(&space).Error

	if err != nil {
		return nil, err
	}

	return &space, nil
}

// Update updates a space
func (r *SpaceRepository) Update(id uuid.UUID, updates map[string]interface{}) (*models.Space, error) {
	// Perform the update
	if err := r.db.Model(&models.Space{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update space: %w", err)
	}

	// Return the updated space
	return r.GetByID(id)
}

// Delete soft deletes a space
func (r *SpaceRepository) Delete(id uuid.UUID) error {
	result := r.db.Where("id = ?", id).Delete(&models.Space{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete space: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// List and Search Operations

// GetAll retrieves all spaces with pagination
func (r *SpaceRepository) GetAll(offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Count total records
	if err := r.db.Model(&models.Space{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces: %w", err)
	}

	// Get spaces with pagination
	err := r.db.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesWithFilters retrieves spaces with advanced filtering
func (r *SpaceRepository) GetSpacesWithFilters(filters map[string]interface{}, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{})

	// Apply filters
	query = r.applyFilters(query, filters)

	// Count total records with filters
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count filtered spaces: %w", err)
	}

	// Apply sorting
	query = r.applySorting(query, filters)

	// Get spaces with pagination
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get filtered spaces: %w", err)
	}

	return spaces, total, nil
}

// SearchSpaces searches spaces with text query and filters
func (r *SpaceRepository) SearchSpaces(filters map[string]interface{}, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{})

	// Apply search query if provided
	if searchQuery, ok := filters["search_query"]; ok && searchQuery != "" {
		searchTerm := fmt.Sprintf("%%%s%%", searchQuery)
		query = query.Where(
			"name ILIKE ? OR description ILIKE ? OR building ILIKE ? OR room_number ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	// Apply other filters
	query = r.applyFilters(query, filters)

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}

	// Apply sorting
	query = r.applySorting(query, filters)

	// Get spaces with pagination
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to search spaces: %w", err)
	}

	return spaces, total, nil
}

// Existence Checks

// ExistsByNameAndBuilding checks if a space exists with the given name and building
func (r *SpaceRepository) ExistsByNameAndBuilding(name, building string) (bool, error) {
	var count int64

	err := r.db.Model(&models.Space{}).
		Where("name = ? AND building = ?", name, building).
		Count(&count).Error

	if err != nil {
		return false, fmt.Errorf("failed to check space existence: %w", err)
	}

	return count > 0, nil
}

// ExistsByNameAndBuildingExcluding checks if a space exists excluding a specific ID
func (r *SpaceRepository) ExistsByNameAndBuildingExcluding(name, building string, excludeID uuid.UUID) (bool, error) {
	var count int64

	err := r.db.Model(&models.Space{}).
		Where("name = ? AND building = ? AND id != ?", name, building, excludeID).
		Count(&count).Error

	if err != nil {
		return false, fmt.Errorf("failed to check space existence: %w", err)
	}

	return count > 0, nil
}

// Building and Location Operations

// GetDistinctBuildings returns all distinct buildings
func (r *SpaceRepository) GetDistinctBuildings() ([]string, error) {
	var buildings []string

	err := r.db.Model(&models.Space{}).
		Distinct("building").
		Where("building IS NOT NULL AND building != ''").
		Order("building ASC").
		Pluck("building", &buildings).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get buildings: %w", err)
	}

	return buildings, nil
}

// GetDistinctFloors returns all distinct floors
func (r *SpaceRepository) GetDistinctFloors() ([]int, error) {
	var floors []int

	err := r.db.Model(&models.Space{}).
		Distinct("floor").
		Order("floor ASC").
		Pluck("floor", &floors).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get floors: %w", err)
	}

	return floors, nil
}

// GetSpacesByBuilding gets spaces by building
func (r *SpaceRepository) GetSpacesByBuilding(building string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{}).Where("building = ?", building)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces in building: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("floor ASC, room_number ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by building: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesByBuildingAndFloor gets spaces by building and floor
func (r *SpaceRepository) GetSpacesByBuildingAndFloor(building string, floor int, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{}).Where("building = ? AND floor = ?", building, floor)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces on floor: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("room_number ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by building and floor: %w", err)
	}

	return spaces, total, nil
}

// Equipment Operations

// GetDistinctEquipment returns all distinct equipment items
func (r *SpaceRepository) GetDistinctEquipment() ([]string, error) {
	var equipment []string

	// This is a simplified implementation - you might need to adjust based on your JSON structure
	rows, err := r.db.Raw(`
		SELECT DISTINCT jsonb_array_elements_text(
			jsonb_path_query_array(equipment, '$[*].name')
		) as equipment_name
		FROM spaces 
		WHERE equipment IS NOT NULL 
		AND jsonb_array_length(equipment) > 0
		ORDER BY equipment_name
	`).Rows()

	if err != nil {
		return nil, fmt.Errorf("failed to get equipment: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var equipmentName string
		if err := rows.Scan(&equipmentName); err != nil {
			continue
		}
		equipment = append(equipment, equipmentName)
	}

	return equipment, nil
}

// GetSpacesByEquipment gets spaces that have specific equipment
func (r *SpaceRepository) GetSpacesByEquipment(equipment []string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{})

	// Build equipment filter - this might need adjustment based on your JSON structure
	for _, eq := range equipment {
		query = query.Where("equipment @> ?", fmt.Sprintf(`[{"name": "%s"}]`, eq))
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces with equipment: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by equipment: %w", err)
	}

	return spaces, total, nil
}

// Manager Operations

// GetSpacesByManager gets spaces managed by a specific manager
func (r *SpaceRepository) GetSpacesByManager(managerID uuid.UUID, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{}).Where("manager_id = ?", managerID)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces by manager: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("building ASC, floor ASC, room_number ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by manager: %w", err)
	}

	return spaces, total, nil
}

// Status Operations

// GetSpacesByStatus gets spaces by status
func (r *SpaceRepository) GetSpacesByStatus(status string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{}).Where("status = ?", status)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces by status: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by status: %w", err)
	}

	return spaces, total, nil
}

// BulkUpdateStatus updates status for multiple spaces
func (r *SpaceRepository) BulkUpdateStatus(spaceIDs []uuid.UUID, status string) error {
	result := r.db.Model(&models.Space{}).
		Where("id IN ?", spaceIDs).
		Update("status", status)

	if result.Error != nil {
		return fmt.Errorf("failed to bulk update status: %w", result.Error)
	}

	return nil
}

// Capacity Operations

// GetSpacesByCapacityRange gets spaces within capacity range
func (r *SpaceRepository) GetSpacesByCapacityRange(minCapacity, maxCapacity int, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{}).
		Where("capacity >= ? AND capacity <= ?", minCapacity, maxCapacity)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces by capacity: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("capacity ASC, name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by capacity: %w", err)
	}

	return spaces, total, nil
}

// Availability Operations

// GetAvailableSpaces gets spaces available during a time period
func (r *SpaceRepository) GetAvailableSpaces(startTime, endTime time.Time, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	// Query for spaces that don't have conflicting reservations
	subQuery := r.db.Table("reservations").
		Select("space_id").
		Where("(start_time < ? AND end_time > ?) AND status IN ('pending', 'approved')", endTime, startTime)

	query := r.db.Model(&models.Space{}).
		Where("status = 'available' AND id NOT IN (?)", subQuery)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count available spaces: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get available spaces: %w", err)
	}

	return spaces, total, nil
}

// CheckSpaceAvailability checks if a specific space is available
func (r *SpaceRepository) CheckSpaceAvailability(spaceID uuid.UUID, startTime, endTime time.Time) (bool, error) {
	var count int64

	err := r.db.Table("reservations").
		Where("space_id = ? AND (start_time < ? AND end_time > ?) AND status IN ('pending', 'approved')",
			spaceID, endTime, startTime).
		Count(&count).Error

	if err != nil {
		return false, fmt.Errorf("failed to check space availability: %w", err)
	}

	return count == 0, nil
}

// Analytics Operations

// GetSpaceAnalytics gets analytics data for a space

// GetPopularSpaces gets the most popular spaces by reservation count
func (r *SpaceRepository) GetPopularSpaces(limit int) ([]*models.Space, error) {
	var spaces []*models.Space

	err := r.db.Table("spaces s").
		Select("s.*, COUNT(r.id) as reservation_count").
		Joins("LEFT JOIN reservations r ON s.id = r.space_id AND r.status IN ('approved', 'completed')").
		Group("s.id").
		Order("reservation_count DESC").
		Limit(limit).
		Find(&spaces).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get popular spaces: %w", err)
	}

	return spaces, nil
}

// GetLeastUsedSpaces gets the least used spaces
func (r *SpaceRepository) GetLeastUsedSpaces(limit int) ([]*models.Space, error) {
	var spaces []*models.Space

	err := r.db.Table("spaces s").
		Select("s.*, COUNT(r.id) as reservation_count").
		Joins("LEFT JOIN reservations r ON s.id = r.space_id AND r.status IN ('approved', 'completed')").
		Group("s.id").
		Order("reservation_count ASC").
		Limit(limit).
		Find(&spaces).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get least used spaces: %w", err)
	}

	return spaces, nil
}

// Pricing Operations

// GetSpacesByPriceRange gets spaces within price range
func (r *SpaceRepository) GetSpacesByPriceRange(minPrice, maxPrice float64, priceType string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	priceColumn := "price_per_hour"
	switch priceType {
	case "day":
		priceColumn = "price_per_day"
	case "month":
		priceColumn = "price_per_month"
	}

	query := r.db.Model(&models.Space{}).
		Where(fmt.Sprintf("%s >= ? AND %s <= ?", priceColumn, priceColumn), minPrice, maxPrice)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces by price: %w", err)
	}

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order(fmt.Sprintf("%s ASC", priceColumn)).
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get spaces by price: %w", err)
	}

	return spaces, total, nil
}

// Advanced Search Operations

// SearchSpacesByName searches spaces by name
func (r *SpaceRepository) SearchSpacesByName(query string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	searchTerm := fmt.Sprintf("%%%s%%", query)
	dbQuery := r.db.Model(&models.Space{}).Where("name ILIKE ?", searchTerm)

	// Count total
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces by name: %w", err)
	}

	// Get spaces
	err := dbQuery.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to search spaces by name: %w", err)
	}

	return spaces, total, nil
}

// SearchSpacesByDescription searches spaces by description
func (r *SpaceRepository) SearchSpacesByDescription(query string, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	searchTerm := fmt.Sprintf("%%%s%%", query)
	dbQuery := r.db.Model(&models.Space{}).Where("description ILIKE ?", searchTerm)

	// Count total
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count spaces by description: %w", err)
	}

	// Get spaces
	err := dbQuery.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order("name ASC").
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to search spaces by description: %w", err)
	}

	return spaces, total, nil
}

// GetSpacesWithMultipleFilters gets spaces with advanced filters
func (r *SpaceRepository) GetSpacesWithMultipleFilters(filters interfaces.SpaceFilters, offset, limit int) ([]*models.Space, int64, error) {
	var spaces []*models.Space
	var total int64

	query := r.db.Model(&models.Space{})

	// Apply all filters
	if len(filters.Types) > 0 {
		query = query.Where("type IN ?", filters.Types)
	}

	if len(filters.Buildings) > 0 {
		query = query.Where("building IN ?", filters.Buildings)
	}

	if len(filters.Floors) > 0 {
		query = query.Where("floor IN ?", filters.Floors)
	}

	if filters.MinCapacity != nil {
		query = query.Where("capacity >= ?", *filters.MinCapacity)
	}

	if filters.MaxCapacity != nil {
		query = query.Where("capacity <= ?", *filters.MaxCapacity)
	}

	if len(filters.Status) > 0 {
		query = query.Where("status IN ?", filters.Status)
	}

	if filters.RequiresApproval != nil {
		query = query.Where("requires_approval = ?", *filters.RequiresApproval)
	}

	if filters.MinPricePerHour != nil {
		query = query.Where("price_per_hour >= ?", *filters.MinPricePerHour)
	}

	if filters.MaxPricePerHour != nil {
		query = query.Where("price_per_hour <= ?", *filters.MaxPricePerHour)
	}

	if filters.SearchQuery != "" {
		searchTerm := fmt.Sprintf("%%%s%%", filters.SearchQuery)
		query = query.Where("name ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count filtered spaces: %w", err)
	}

	// Apply sorting
	sortBy := filters.SortBy
	if sortBy == "" {
		sortBy = "name"
	}

	sortOrder := filters.SortOrder
	if sortOrder == "" {
		sortOrder = "asc"
	}

	orderClause := fmt.Sprintf("%s %s", sortBy, strings.ToUpper(sortOrder))

	// Get spaces
	err := query.Preload("Manager").
		Offset(offset).
		Limit(limit).
		Order(orderClause).
		Find(&spaces).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to get filtered spaces: %w", err)
	}

	return spaces, total, nil
}

// Batch Operations

// CreateBatch creates multiple spaces
func (r *SpaceRepository) CreateBatch(spaces []*models.Space) ([]*models.Space, error) {
	if err := r.db.Create(spaces).Error; err != nil {
		return nil, fmt.Errorf("failed to create spaces batch: %w", err)
	}

	return spaces, nil
}

// UpdateBatch updates multiple spaces
func (r *SpaceRepository) UpdateBatch(updates []interfaces.SpaceUpdate) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			if err := tx.Model(&models.Space{}).
				Where("id = ?", update.SpaceID).
				Updates(update.Updates).Error; err != nil {
				return fmt.Errorf("failed to update space %s: %w", update.SpaceID, err)
			}
		}
		return nil
	})
}

// DeleteBatch deletes multiple spaces
func (r *SpaceRepository) DeleteBatch(spaceIDs []uuid.UUID) error {
	result := r.db.Where("id IN ?", spaceIDs).Delete(&models.Space{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete spaces batch: %w", result.Error)
	}

	return nil
}

// Relationship Operations

// GetSpaceWithManager gets space with manager preloaded
func (r *SpaceRepository) GetSpaceWithManager(spaceID uuid.UUID) (*models.Space, error) {
	var space models.Space

	err := r.db.Preload("Manager").
		Where("id = ?", spaceID).
		First(&space).Error

	if err != nil {
		return nil, err
	}

	return &space, nil
}

// GetSpaceWithReservations gets space with reservations preloaded
func (r *SpaceRepository) GetSpaceWithReservations(spaceID uuid.UUID) (*models.Space, error) {
	var space models.Space

	err := r.db.Preload("Reservations").
		Where("id = ?", spaceID).
		First(&space).Error

	if err != nil {
		return nil, err
	}

	return &space, nil
}

// GetSpaceWithAll gets space with all relations preloaded
func (r *SpaceRepository) GetSpaceWithAll(spaceID uuid.UUID) (*models.Space, error) {
	var space models.Space

	err := r.db.Preload("Manager").
		Preload("Reservations").
		Where("id = ?", spaceID).
		First(&space).Error

	if err != nil {
		return nil, err
	}

	return &space, nil
}

// Count Operations

// CountSpaces counts total spaces
func (r *SpaceRepository) CountSpaces() (int64, error) {
	var count int64

	err := r.db.Model(&models.Space{}).Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("failed to count spaces: %w", err)
	}

	return count, nil
}

// CountSpacesByStatus counts spaces by status
func (r *SpaceRepository) CountSpacesByStatus(status string) (int64, error) {
	var count int64

	err := r.db.Model(&models.Space{}).
		Where("status = ?", status).
		Count(&count).Error

	if err != nil {
		return 0, fmt.Errorf("failed to count spaces by status: %w", err)
	}

	return count, nil
}

// CountSpacesByBuilding counts spaces by building
func (r *SpaceRepository) CountSpacesByBuilding(building string) (int64, error) {
	var count int64

	err := r.db.Model(&models.Space{}).
		Where("building = ?", building).
		Count(&count).Error

	if err != nil {
		return 0, fmt.Errorf("failed to count spaces by building: %w", err)
	}

	return count, nil
}

// CountSpacesByType counts spaces by type
func (r *SpaceRepository) CountSpacesByType(spaceType string) (int64, error) {
	var count int64

	err := r.db.Model(&models.Space{}).
		Where("type = ?", spaceType).
		Count(&count).Error

	if err != nil {
		return 0, fmt.Errorf("failed to count spaces by type: %w", err)
	}

	return count, nil
}

// Helper Methods

// applyFilters applies filters to the query
func (r *SpaceRepository) applyFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	if types, ok := filters["types"]; ok && types != nil {
		if typeSlice, ok := types.([]string); ok && len(typeSlice) > 0 {
			query = query.Where("type IN ?", typeSlice)
		}
	}

	if buildings, ok := filters["buildings"]; ok && buildings != nil {
		if buildingSlice, ok := buildings.([]string); ok && len(buildingSlice) > 0 {
			query = query.Where("building IN ?", buildingSlice)
		}
	}

	if floors, ok := filters["floors"]; ok && floors != nil {
		if floorSlice, ok := floors.([]int); ok && len(floorSlice) > 0 {
			query = query.Where("floor IN ?", floorSlice)
		}
	}

	if minCapacity, ok := filters["min_capacity"]; ok && minCapacity != nil {
		if minCap, ok := minCapacity.(int); ok {
			query = query.Where("capacity >= ?", minCap)
		}
	}

	if maxCapacity, ok := filters["max_capacity"]; ok && maxCapacity != nil {
		if maxCap, ok := maxCapacity.(int); ok {
			query = query.Where("capacity <= ?", maxCap)
		}
	}

	if status, ok := filters["status"]; ok && status != nil {
		if statusSlice, ok := status.([]string); ok && len(statusSlice) > 0 {
			query = query.Where("status IN ?", statusSlice)
		}
	}

	if maxPricePerHour, ok := filters["max_price_per_hour"]; ok && maxPricePerHour != nil {
		if price, ok := maxPricePerHour.(float64); ok {
			query = query.Where("price_per_hour <= ?", price)
		}
	}

	if maxPricePerDay, ok := filters["max_price_per_day"]; ok && maxPricePerDay != nil {
		if price, ok := maxPricePerDay.(float64); ok {
			query = query.Where("price_per_day <= ?", price)
		}
	}

	if maxPricePerMonth, ok := filters["max_price_per_month"]; ok && maxPricePerMonth != nil {
		if price, ok := maxPricePerMonth.(float64); ok {
			query = query.Where("price_per_month <= ?", price)
		}
	}

	if requiresApproval, ok := filters["requires_approval"]; ok && requiresApproval != nil {
		if approval, ok := requiresApproval.(bool); ok {
			query = query.Where("requires_approval = ?", approval)
		}
	}

	// Add availability filter if provided
	if startTime, ok := filters["available_start_time"]; ok {
		if endTime, ok2 := filters["available_end_time"]; ok2 {
			if start, ok3 := startTime.(time.Time); ok3 {
				if end, ok4 := endTime.(time.Time); ok4 {
					// Exclude spaces with conflicting reservations
					subQuery := r.db.Table("reservations").
						Select("space_id").
						Where("(start_time < ? AND end_time > ?) AND status IN ('pending', 'approved')", end, start)
					query = query.Where("id NOT IN (?)", subQuery)
				}
			}
		}
	}

	return query
}

// applySorting applies sorting to the query
func (r *SpaceRepository) applySorting(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	sortBy := "name"
	sortOrder := "asc"

	if sb, ok := filters["sort_by"]; ok && sb != nil {
		if sortByStr, ok := sb.(string); ok && sortByStr != "" {
			sortBy = sortByStr
		}
	}

	if so, ok := filters["sort_order"]; ok && so != nil {
		if sortOrderStr, ok := so.(string); ok && strings.ToLower(sortOrderStr) == "desc" {
			sortOrder = "desc"
		}
	}

	orderClause := fmt.Sprintf("%s %s", sortBy, strings.ToUpper(sortOrder))

	return query.Order(orderClause)
}

// getPeakHours gets peak hours for a space
func (r *SpaceRepository) getPeakHours(spaceID uuid.UUID, startDate, endDate time.Time) ([]int, error) {
	var peakHours []int

	rows, err := r.db.Raw(`
		SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as count
		FROM reservations 
		WHERE space_id = ? AND start_time >= ? AND start_time <= ? 
		  AND status IN ('approved', 'completed')
		GROUP BY EXTRACT(HOUR FROM start_time)
		ORDER BY count DESC
		LIMIT 5
	`, spaceID, startDate, endDate).Rows()

	if err != nil {
		return nil, fmt.Errorf("failed to get peak hours: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var hour int
		var count int
		if err := rows.Scan(&hour, &count); err != nil {
			continue
		}
		peakHours = append(peakHours, hour)
	}

	return peakHours, nil
}
