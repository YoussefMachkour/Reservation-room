package interfaces

import (
	"room-reservation-api/internal/models"

	"github.com/google/uuid"
)

// UserRepositoryInterface defines the contract for user data operations
type UserRepositoryInterface interface {
	// Basic CRUD operations
	Create(user *models.User) error
	GetByID(id uuid.UUID) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	Update(user *models.User) error
	Delete(id uuid.UUID) error

	// Query operations
	GetAll(limit, offset int) ([]models.User, int64, error)
	GetByRole(role models.UserRole) ([]models.User, error)
	Search(query string, limit, offset int) ([]models.User, int64, error)

	// Status operations
	Activate(id uuid.UUID) error
	Deactivate(id uuid.UUID) error
	UpdateRole(id uuid.UUID, role models.UserRole) error
	UpdatePassword(id uuid.UUID, passwordHash string) error
	UpdateLastLogin(id uuid.UUID) error

	// Existence checks
	ExistsByEmail(email string) (bool, error)
	ExistsByID(id uuid.UUID) (bool, error)

	// Advanced queries
	GetActiveUsers(limit, offset int) ([]models.User, int64, error)
	GetInactiveUsers(limit, offset int) ([]models.User, int64, error)
	GetUsersByDepartment(department string) ([]models.User, error)
	GetRecentUsers(days int, limit, offset int) ([]models.User, int64, error)

	// Statistics
	CountTotal() (int64, error)
	CountByRole(role models.UserRole) (int64, error)
	CountActiveUsers() (int64, error)
	CountInactiveUsers() (int64, error)
}
