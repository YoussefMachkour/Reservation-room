// internal/services/auth_service.go
package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"room-reservation-api/internal/models"
	"room-reservation-api/internal/utils"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserExists         = errors.New("user already exists")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthService struct {
	db        *gorm.DB
	jwtSecret string
	jwtExpiry time.Duration
}

func NewAuthService(db *gorm.DB, jwtSecret string, jwtExpiry time.Duration) *AuthService {
	return &AuthService{
		db:        db,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

// LoginRequest represents login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" validate:"required,email"`
	Password string `json:"password" binding:"required" validate:"required,min=8"`
}

// RegisterRequest represents registration request payload
type RegisterRequest struct {
	FirstName  string `json:"first_name" binding:"required" validate:"required,min=2,max=100"`
	LastName   string `json:"last_name" binding:"required" validate:"required,min=2,max=100"`
	Email      string `json:"email" binding:"required,email" validate:"required,email"`
	Password   string `json:"password" binding:"required" validate:"required,min=8"`
	Phone      string `json:"phone" validate:"omitempty,e164"`
	Department string `json:"department" validate:"omitempty,max=100"`
	Position   string `json:"position" validate:"omitempty,max=100"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	TokenType    string       `json:"token_type"`
	ExpiresAt    time.Time    `json:"expires_at"`
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	var user models.User
	if err := s.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, ErrUserInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.db.Save(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to update last login: %w", err)
	}

	// Generate tokens
	accessToken, err := utils.GenerateJWT(user.ID, user.Role, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := utils.GenerateJWT(user.ID, user.Role, s.jwtSecret, 7*24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return &AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresAt:    now.Add(s.jwtExpiry),
	}, nil
}

// Register creates a new user account
func (s *AuthService) Register(req RegisterRequest) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		ID:           uuid.New(),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Phone:        req.Phone,
		Department:   req.Department,
		Position:     req.Position,
		Role:         models.RoleStandardUser,
		IsActive:     true,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return user, nil
}

// RefreshToken generates new tokens using refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*AuthResponse, error) {
	claims, err := utils.ValidateJWT(refreshToken, s.jwtSecret)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Get user from database
	var user models.User
	if err := s.db.Where("id = ? AND is_active = ?", claims.UserID, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Generate new tokens
	now := time.Now()
	accessToken, err := utils.GenerateJWT(user.ID, user.Role, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := utils.GenerateJWT(user.ID, user.Role, s.jwtSecret, 7*24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password hash from response
	user.PasswordHash = ""

	return &AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresAt:    now.Add(s.jwtExpiry),
	}, nil
}

// GetUserByID retrieves user by ID
func (s *AuthService) GetUserByID(userID uuid.UUID) (*models.User, error) {
	var user models.User
	if err := s.db.Where("id = ? AND is_active = ?", userID, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Remove password hash
	user.PasswordHash = ""
	return &user, nil
}

// ChangePassword changes user password
func (s *AuthService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return ErrInvalidCredentials
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// ResetPassword initiates password reset process
func (s *AuthService) ResetPassword(email string) error {
	var user models.User
	if err := s.db.Where("email = ? AND is_active = ?", email, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Don't reveal if email exists or not
			return nil
		}
		return fmt.Errorf("database error: %w", err)
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
		return nil, ErrInvalidToken
	}

	// Get user from database
	var user models.User
	if err := s.db.Where("id = ? AND is_active = ?", claims.UserID, true).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	user.PasswordHash = ""
	return &user, nil
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
	if err := s.db.Model(&models.User{}).Where("id = ?", user.ID).Update("password_hash", string(hashedPassword)).Error; err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}
