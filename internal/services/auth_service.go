// internal/services/auth_service.go
package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"
	"room-reservation-api/internal/utils"
)

type AuthService struct {
	userRepo  interfaces.UserRepositoryInterface
	jwtSecret string
	jwtExpiry time.Duration
}

func NewAuthService(userRepo interfaces.UserRepositoryInterface, jwtSecret string, jwtExpiry time.Duration) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

// CreateUser creates a new user account
func (s *AuthService) CreateUser(user *models.User) error {
	// Check if user already exists
	exists, err := s.userRepo.ExistsByEmail(user.Email)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists {
		return dto.ErrUserExists
	}

	// Create user
	if err := s.userRepo.Create(user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByEmail retrieves user by email
func (s *AuthService) GetUserByEmail(email string) (*models.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, dto.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return user, nil
}

// GetUserByID retrieves user by ID
func (s *AuthService) GetUserByID(userID uuid.UUID) (*models.User, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, dto.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	return user, nil
}

// UpdateUser updates user information
func (s *AuthService) UpdateUser(user *models.User) error {
	if err := s.userRepo.Update(user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// ChangePassword changes user password
func (s *AuthService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return dto.ErrUserNotFound
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return dto.ErrInvalidCredentials
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	if err := s.userRepo.UpdatePassword(userID, string(hashedPassword)); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// ValidateUser validates user credentials and returns user if valid
func (s *AuthService) ValidateUser(email, password string) (*models.User, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, dto.ErrInvalidCredentials
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, dto.ErrUserInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, dto.ErrInvalidCredentials
	}

	return user, nil
}

// RefreshToken generates new tokens using refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*models.User, string, error) {
	claims, err := utils.ValidateJWT(refreshToken, s.jwtSecret)
	if err != nil {
		return nil, "", dto.ErrInvalidToken
	}

	// Get user from database
	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", dto.ErrUserNotFound
		}
		return nil, "", fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, "", dto.ErrUserInactive
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(user.ID, user.Role, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate access token: %w", err)
	}

	return user, accessToken, nil
}

// ResetPassword initiates password reset process
func (s *AuthService) ResetPassword(email string) error {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Don't reveal if email exists or not
			return nil
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		// Don't reveal if user is inactive
		return nil
	}

	// Generate reset token (valid for 1 hour)
	resetToken, err := utils.GenerateJWT(user.ID, user.Role, s.jwtSecret, time.Hour)
	if err != nil {
		return fmt.Errorf("failed to generate reset token: %w", err)
	}

	// TODO: Send email with reset token
	// This would typically involve sending an email with a reset link
	// For now, we'll just log it (in production, use proper email service)
	fmt.Printf("Password reset token for %s: %s\n", email, resetToken)

	return nil
}

// ValidateResetToken validates password reset token
func (s *AuthService) ValidateResetToken(token string) (*models.User, error) {
	claims, err := utils.ValidateJWT(token, s.jwtSecret)
	if err != nil {
		return nil, dto.ErrInvalidToken
	}

	// Get user from database
	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, dto.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, dto.ErrUserInactive
	}

	return user, nil
}

// CompletePasswordReset completes password reset with new password
func (s *AuthService) CompletePasswordReset(token, newPassword string) error {
	user, err := s.ValidateResetToken(token)
	if err != nil {
		return err
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	if err := s.userRepo.UpdatePassword(user.ID, string(hashedPassword)); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// DeactivateUser deactivates a user account
func (s *AuthService) DeactivateUser(userID uuid.UUID) error {
	if err := s.userRepo.Deactivate(userID); err != nil {
		return fmt.Errorf("failed to deactivate user: %w", err)
	}
	return nil
}

// ActivateUser activates a user account
func (s *AuthService) ActivateUser(userID uuid.UUID) error {
	if err := s.userRepo.Activate(userID); err != nil {
		return fmt.Errorf("failed to activate user: %w", err)
	}
	return nil
}

// GetAllUsers retrieves all users (for admin purposes)
func (s *AuthService) GetAllUsers(limit, offset int) ([]models.User, int64, error) {
	users, total, err := s.userRepo.GetAll(limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get users: %w", err)
	}
	return users, total, nil
}

// UpdateUserRole updates user role (admin only)
func (s *AuthService) UpdateUserRole(userID uuid.UUID, role models.UserRole) error {
	if err := s.userRepo.UpdateRole(userID, role); err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}
	return nil
}

// DeleteUser soft deletes a user
func (s *AuthService) DeleteUser(userID uuid.UUID) error {
	if err := s.userRepo.Delete(userID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

// GetUsersByRole retrieves users by role
func (s *AuthService) GetUsersByRole(role models.UserRole) ([]models.User, error) {
	users, err := s.userRepo.GetByRole(role)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by role: %w", err)
	}
	return users, nil
}

// SearchUsers searches users by name or email
func (s *AuthService) SearchUsers(query string, limit, offset int) ([]models.User, int64, error) {
	users, total, err := s.userRepo.Search(query, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search users: %w", err)
	}
	return users, total, nil
}

// GetActiveUsers retrieves only active users
func (s *AuthService) GetActiveUsers(limit, offset int) ([]models.User, int64, error) {
	users, total, err := s.userRepo.GetActiveUsers(limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get active users: %w", err)
	}
	return users, total, nil
}

// GetInactiveUsers retrieves only inactive users
func (s *AuthService) GetInactiveUsers(limit, offset int) ([]models.User, int64, error) {
	users, total, err := s.userRepo.GetInactiveUsers(limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get inactive users: %w", err)
	}
	return users, total, nil
}

// GetUsersByDepartment retrieves users by department
func (s *AuthService) GetUsersByDepartment(department string) ([]models.User, error) {
	users, err := s.userRepo.GetUsersByDepartment(department)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by department: %w", err)
	}
	return users, nil
}

// GetRecentUsers retrieves users created in the last N days
func (s *AuthService) GetRecentUsers(days int, limit, offset int) ([]models.User, int64, error) {
	users, total, err := s.userRepo.GetRecentUsers(days, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get recent users: %w", err)
	}
	return users, total, nil
}

// GetUserStats returns user statistics
func (s *AuthService) GetUserStats() (map[string]int64, error) {
	stats := make(map[string]int64)

	total, err := s.userRepo.CountTotal()
	if err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}
	stats["total"] = total

	active, err := s.userRepo.CountActiveUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to count active users: %w", err)
	}
	stats["active"] = active

	inactive, err := s.userRepo.CountInactiveUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to count inactive users: %w", err)
	}
	stats["inactive"] = inactive

	admins, err := s.userRepo.CountByRole(models.RoleAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to count admin users: %w", err)
	}
	stats["admins"] = admins

	managers, err := s.userRepo.CountByRole(models.RoleManager)
	if err != nil {
		return nil, fmt.Errorf("failed to count manager users: %w", err)
	}
	stats["managers"] = managers

	users, err := s.userRepo.CountByRole(models.RoleStandardUser)
	if err != nil {
		return nil, fmt.Errorf("failed to count standard users: %w", err)
	}
	stats["users"] = users

	return stats, nil
}
