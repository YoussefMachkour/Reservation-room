package repositories

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository instance
func NewUserRepository(db *gorm.DB) interfaces.UserRepositoryInterface {
	return &userRepository{
		db: db,
	}
}

// Create creates a new user in the database
func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// Update updates a user in the database
func (r *userRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

// Delete soft deletes a user
func (r *userRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.User{}, id).Error
}

// GetAll retrieves all users with pagination
func (r *userRepository) GetAll(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	// Count total users
	if err := r.db.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get users with pagination
	if err := r.db.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, total, nil
}

// GetByRole retrieves users by role
func (r *userRepository) GetByRole(role models.UserRole) ([]models.User, error) {
	var users []models.User
	if err := r.db.Where("role = ? AND is_active = ?", role, true).Find(&users).Error; err != nil {
		return nil, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, nil
}

// Search searches users by name or email
func (r *userRepository) Search(query string, limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	searchQuery := "%" + query + "%"

	// Count total matching users
	if err := r.db.Model(&models.User{}).Where(
		"(first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?) AND is_active = ?",
		searchQuery, searchQuery, searchQuery, true,
	).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get matching users with pagination
	if err := r.db.Where(
		"(first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?) AND is_active = ?",
		searchQuery, searchQuery, searchQuery, true,
	).Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, total, nil
}

// Activate activates a user account
func (r *userRepository) Activate(id uuid.UUID) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("is_active", true).Error
}

// Deactivate deactivates a user account
func (r *userRepository) Deactivate(id uuid.UUID) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("is_active", false).Error
}

// UpdateRole updates a user's role
func (r *userRepository) UpdateRole(id uuid.UUID, role models.UserRole) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("role", role).Error
}

// UpdatePassword updates a user's password hash
func (r *userRepository) UpdatePassword(id uuid.UUID, passwordHash string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

// UpdateLastLogin updates the last login timestamp
func (r *userRepository) UpdateLastLogin(id uuid.UUID) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("last_login_at", time.Now()).Error
}

// ExistsByEmail checks if a user exists by email
func (r *userRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// ExistsByID checks if a user exists by ID
func (r *userRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("id = ?", id).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetActiveUsers retrieves only active users
func (r *userRepository) GetActiveUsers(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	// Count active users
	if err := r.db.Model(&models.User{}).Where("is_active = ?", true).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get active users
	if err := r.db.Where("is_active = ?", true).Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, total, nil
}

// GetInactiveUsers retrieves only inactive users
func (r *userRepository) GetInactiveUsers(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	// Count inactive users
	if err := r.db.Model(&models.User{}).Where("is_active = ?", false).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get inactive users
	if err := r.db.Where("is_active = ?", false).Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, total, nil
}

// GetUsersByDepartment retrieves users by department
func (r *userRepository) GetUsersByDepartment(department string) ([]models.User, error) {
	var users []models.User
	if err := r.db.Where("department = ? AND is_active = ?", department, true).Find(&users).Error; err != nil {
		return nil, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, nil
}

// GetRecentUsers retrieves users created in the last N days
func (r *userRepository) GetRecentUsers(days int, limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	since := time.Now().AddDate(0, 0, -days)

	// Count recent users
	if err := r.db.Model(&models.User{}).Where("created_at >= ?", since).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get recent users
	if err := r.db.Where("created_at >= ?", since).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// Remove password hashes
	for i := range users {
		users[i].PasswordHash = ""
	}

	return users, total, nil
}

// CountTotal returns the total number of users
func (r *userRepository) CountTotal() (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}
	return count, nil
}

// CountByRole returns the count of users by role
func (r *userRepository) CountByRole(role models.UserRole) (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("role = ?", role).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count users by role: %w", err)
	}
	return count, nil
}

// CountActiveUsers returns the count of active users
func (r *userRepository) CountActiveUsers() (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("is_active = ?", true).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count active users: %w", err)
	}
	return count, nil
}

// CountInactiveUsers returns the count of inactive users
func (r *userRepository) CountInactiveUsers() (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("is_active = ?", false).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count inactive users: %w", err)
	}
	return count, nil
}
