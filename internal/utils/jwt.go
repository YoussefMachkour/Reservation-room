// internal/utils/jwt.go
package utils

import (
	"errors"
	"time"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims represents the claims in JWT token
type JWTClaims struct {
	UserID uuid.UUID       `json:"user_id"`
	Role   models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// GenerateJWT generates a new JWT token
func GenerateJWT(userID uuid.UUID, role models.UserRole, secret string, expiry time.Duration) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWT validates and parses JWT token
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, dto.ErrInvalidToken
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, dto.ErrTokenExpired
		}
		return nil, dto.ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, dto.ErrInvalidToken
	}

	return claims, nil
}

// ExtractUserIDFromToken extracts user ID from JWT token without validation
func ExtractUserIDFromToken(tokenString string) (uuid.UUID, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &JWTClaims{})
	if err != nil {
		return uuid.Nil, dto.ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return uuid.Nil, dto.ErrInvalidToken
	}

	return claims.UserID, nil
}

// RefreshTokenIfNeeded checks if token needs refresh and returns new token if needed
func RefreshTokenIfNeeded(tokenString, secret string, refreshThreshold time.Duration) (string, bool, error) {
	claims, err := ValidateJWT(tokenString, secret)
	if err != nil {
		return "", false, err
	}

	// Check if token is close to expiry
	if time.Until(claims.ExpiresAt.Time) < refreshThreshold {
		newToken, err := GenerateJWT(claims.UserID, claims.Role, secret, time.Hour*24*7)
		if err != nil {
			return "", false, err
		}
		return newToken, true, nil
	}

	return tokenString, false, nil
}
