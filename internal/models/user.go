// internal/models/user.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin        UserRole = "admin"
	RoleManager      UserRole = "manager"
	RoleStandardUser UserRole = "user"
)

type User struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	FirstName      string         `json:"first_name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	LastName       string         `json:"last_name" gorm:"not null;size:100" validate:"required,min=2,max=100"`
	Email          string         `json:"email" gorm:"unique;not null;size:255" validate:"required,email"`
	PasswordHash   string         `json:"-" gorm:"not null;size:255"`
	Role           UserRole       `json:"role" gorm:"type:varchar(20);default:'user'"`
	IsActive       bool           `json:"is_active" gorm:"default:true"`
	LastLoginAt    *time.Time     `json:"last_login_at"`
	Phone          string         `json:"phone" gorm:"size:20" validate:"omitempty,e164"`
	ProfilePicture string         `json:"profile_picture" gorm:"size:255"`
	Department     string         `json:"department" gorm:"size:100"`
	Position       string         `json:"position" gorm:"size:100"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Reservations  []Reservation `json:"reservations,omitempty" gorm:"foreignKey:UserID"`
	ManagedSpaces []Space       `json:"managed_spaces,omitempty" gorm:"foreignKey:ManagerID"`
	// Notifications []Notification `json:"notifications,omitempty" gorm:"foreignKey:UserID"`
}

// TableName returns the table name for User model
func (User) TableName() string {
	return "users"
}

// BeforeCreate hook to set ID if not provided
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// GetFullName returns the full name of the user
func (u *User) GetFullName() string {
	return u.FirstName + " " + u.LastName
}

// IsAdmin checks if user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

// IsManager checks if user has manager role
func (u *User) IsManager() bool {
	return u.Role == RoleManager
}

// CanManageSpace checks if user can manage a specific space
func (u *User) CanManageSpace(space *Space) bool {
	if u.IsAdmin() {
		return true
	}
	if u.IsManager() && space.ManagerID != nil && *space.ManagerID == u.ID {
		return true
	}
	return false
}
