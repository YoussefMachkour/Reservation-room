package handlers

import (
	"time"

	"gorm.io/gorm"

	"room-reservation-api/internal/config"
	"room-reservation-api/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
	cfg         *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(db, cfg.JWTSecret, time.Hour*24*7), // 7 days expiry
		cfg:         cfg,
	}
}

// func (h *AuthHandler) Register(c *gin.Context) {
// 	var req models.RegisterRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// Hash password
// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
// 		return
// 	}

// 	user := &models.User{
// 		Name:         req.Name,
// 		Email:        req.Email,
// 		PasswordHash: string(hashedPassword),
// 	}

// 	if err := h.authService.CreateUser(user); err != nil {
// 		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
// 		return
// 	}

// 	token, err := h.generateToken(user.ID)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
// 		return
// 	}

// 	response := models.AuthResponse{
// 		User:  *user,
// 		Token: token,
// 	}

// 	c.JSON(http.StatusCreated, response)
// }

// func (h *AuthHandler) Login(c *gin.Context) {
// 	var req models.LoginRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	user, err := h.authService.GetUserByEmail(req.Email)
// 	if err != nil {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
// 		return
// 	}

// 	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
// 		return
// 	}

// 	token, err := h.generateToken(user.ID)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
// 		return
// 	}

// 	response := models.AuthResponse{
// 		User:  *user,
// 		Token: token,
// 	}

// 	c.JSON(http.StatusOK, response)
// }

// func (h *AuthHandler) GetProfile(c *gin.Context) {
// 	userID, exists := c.Get("user_id")
// 	if !exists {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
// 		return
// 	}

// 	user, err := h.authService.GetUserByID(userID.(int))
// 	if err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, user)
// }

// func (h *AuthHandler) generateToken(userID int) (string, error) {
// 	claims := jwt.MapClaims{
// 		"user_id": userID,
// 		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
// 	}

// 	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
// 	return token.SignedString([]byte(h.cfg.JWTSecret))
// }
