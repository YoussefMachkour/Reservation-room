package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"room-reservation-api/internal/config"
	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories"
	"room-reservation-api/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
	cfg         *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	userRepo := repositories.NewUserRepository(db)
	return &AuthHandler{
		authService: services.NewAuthService(userRepo, cfg.JWTSecret, time.Hour*24*7), // 7 days expiry
		cfg:         cfg,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.User{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Phone:        req.Phone,
		Department:   req.Department,
		Position:     req.Position,
		Role:         models.RoleStandardUser, // Default role
		IsActive:     true,
	}

	if err := h.authService.CreateUser(user); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := dto.AuthResponse{
		User:  dto.ToUserResponse(user),
		Token: token,
	}

	c.JSON(http.StatusCreated, response)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.authService.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Update last login time
	now := time.Now()
	user.LastLoginAt = &now
	if err := h.authService.UpdateUser(user); err != nil {
		// Log error but don't fail the login
		// logger.Error("Failed to update last login time", err)
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := dto.AuthResponse{
		User:  dto.ToUserResponse(user),
		Token: token,
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert string to UUID
	userUUID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.authService.GetUserByID(userUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, dto.ToUserResponse(user))
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert string to UUID
	userUUID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.authService.GetUserByID(userUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update fields if provided
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.ProfilePicture != "" {
		user.ProfilePicture = req.ProfilePicture
	}
	if req.Department != "" {
		user.Department = req.Department
	}
	if req.Position != "" {
		user.Position = req.Position
	}

	if err := h.authService.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, dto.ToUserResponse(user))
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert string to UUID
	userUUID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.authService.GetUserByID(userUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user.PasswordHash = string(hashedPassword)
	if err := h.authService.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, newToken, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	response := dto.RefreshTokenResponse{
		AccessToken: newToken,
		TokenType:   "Bearer",
		ExpiresAt:   time.Now().Add(time.Hour * 24 * 7).Unix(),
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	h.authService.UpdateUser(user)

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ResetPassword(req.Email); err != nil {
		// Don't reveal if email exists or not for security
		c.JSON(http.StatusOK, dto.MessageResponse{
			Message: "If the email exists, a password reset link has been sent",
		})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "If the email exists, a password reset link has been sent",
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.CompletePasswordReset(req.Token, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "Password reset successfully",
	})
}

// Admin-only endpoints
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	var query dto.GetUsersQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate offset
	offset := (query.Page - 1) * query.Limit

	var users []models.User
	var total int64
	var err error

	if query.Search != "" {
		users, total, err = h.authService.SearchUsers(query.Search, query.Limit, offset)
	} else {
		users, total, err = h.authService.GetAllUsers(query.Limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	response := dto.ToUsersListResponse(users, total, query.Page, query.Limit)
	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) SearchUsers(c *gin.Context) {
	var query dto.GetUsersQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if query.Search == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	// Calculate offset
	offset := (query.Page - 1) * query.Limit

	users, total, err := h.authService.SearchUsers(query.Search, query.Limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	response := dto.ToUsersListResponse(users, total, query.Page, query.Limit)
	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) UpdateUserRole(c *gin.Context) {
	userIDParam := c.Param("id")
	userUUID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req dto.UpdateUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.UpdateUserRole(userUUID, req.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "User role updated successfully",
	})
}

func (h *AuthHandler) ActivateUser(c *gin.Context) {
	userIDParam := c.Param("id")
	userUUID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.authService.ActivateUser(userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate user"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "User activated successfully",
	})
}

func (h *AuthHandler) DeactivateUser(c *gin.Context) {
	userIDParam := c.Param("id")
	userUUID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.authService.DeactivateUser(userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate user"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "User deactivated successfully",
	})
}

func (h *AuthHandler) DeleteUser(c *gin.Context) {
	userIDParam := c.Param("id")
	userUUID, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.authService.DeleteUser(userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "User deleted successfully",
	})
}

func (h *AuthHandler) generateToken(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWTSecret))
}
