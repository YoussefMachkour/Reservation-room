// internal/utils/jwt.go
package utils

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"strings"
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
	log.Printf("🔧 Generating JWT for user %s with role %s", userID.String(), role)

	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	log.Printf("🔧 JWT claims: UserID=%s, Role=%s, ExpiresAt=%v",
		claims.UserID.String(), claims.Role, claims.ExpiresAt.Time)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))

	if err != nil {
		log.Printf("❌ Failed to sign JWT: %v", err)
		return "", err
	}

	log.Printf("✅ JWT generated successfully, length: %d", len(tokenString))
	return tokenString, nil
}

// ValidateJWT validates and parses JWT token
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	log.Printf("🔍 Starting JWT validation...")
	log.Printf("Token length: %d", len(tokenString))
	log.Printf("Secret provided: %t (length: %d)", secret != "", len(secret))

	// Debug: Check token structure
	parts := strings.Split(tokenString, ".")
	log.Printf("Token parts: %d (should be 3)", len(parts))

	if len(parts) == 3 {
		// Try to decode payload for debugging (without verification)
		if payload, err := base64.RawURLEncoding.DecodeString(parts[1]); err == nil {
			log.Printf("Token payload preview: %s", string(payload))
		}
	}

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		log.Printf("🔍 Validating signing method: %v", token.Method.Alg())

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("❌ Invalid signing method: expected HMAC, got %v", token.Method.Alg())
			return nil, dto.ErrInvalidToken
		}

		log.Printf("✅ Signing method validated")
		return []byte(secret), nil
	})

	if err != nil {
		log.Printf("❌ JWT parsing failed: %v", err)

		if errors.Is(err, jwt.ErrTokenExpired) {
			log.Printf("❌ Token expired")
			return nil, dto.ErrTokenExpired
		}

		return nil, dto.ErrInvalidToken
	}

	log.Printf("✅ JWT parsing successful")

	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		log.Printf("❌ Could not cast claims to JWTClaims")
		return nil, dto.ErrInvalidToken
	}

	if !token.Valid {
		log.Printf("❌ Token is not valid (token.Valid = false)")
		return nil, dto.ErrInvalidToken
	}

	log.Printf("✅ Claims extracted successfully:")
	log.Printf("  - UserID: %s", claims.UserID.String())
	log.Printf("  - Role: %s", claims.Role)

	// SAFE ExpiresAt check - this is the fix for the panic
	if claims.ExpiresAt != nil {
		log.Printf("  - ExpiresAt: %v", claims.ExpiresAt.Time)

		// Check if token is expired (safe check)
		if time.Now().After(claims.ExpiresAt.Time) {
			log.Printf("❌ Token expired: %v (current time: %v)", claims.ExpiresAt.Time, time.Now())
			return nil, dto.ErrTokenExpired
		}
	} else {
		log.Printf("  - ExpiresAt: nil (no expiration set)")
	}

	if claims.IssuedAt != nil {
		log.Printf("  - IssuedAt: %v", claims.IssuedAt.Time)
	} else {
		log.Printf("  - IssuedAt: nil")
	}

	// Additional validation
	if claims.UserID == uuid.Nil {
		log.Printf("❌ Invalid user ID in claims: %s", claims.UserID.String())
		return nil, dto.ErrInvalidToken
	}

	log.Printf("✅ JWT validation completed successfully")
	return claims, nil
}

// DebugTokenStructure provides detailed debugging of token structure
func DebugTokenStructure(tokenString string) {
	log.Printf("🔍 === JWT STRUCTURE DEBUG ===")

	parts := strings.Split(tokenString, ".")
	log.Printf("Token parts count: %d", len(parts))

	if len(parts) != 3 {
		log.Printf("❌ Invalid JWT structure")
		return
	}

	// Header
	if headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0]); err == nil {
		var header map[string]interface{}
		if json.Unmarshal(headerBytes, &header) == nil {
			log.Printf("Header: %+v", header)
		}
	} else {
		log.Printf("❌ Could not decode header: %v", err)
	}

	// Payload
	if payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1]); err == nil {
		var payload map[string]interface{}
		if json.Unmarshal(payloadBytes, &payload) == nil {
			log.Printf("Payload: %+v", payload)

			// Check specific fields
			if userID, ok := payload["user_id"]; ok {
				log.Printf("  user_id: %v (type: %T)", userID, userID)
			}
			if role, ok := payload["role"]; ok {
				log.Printf("  role: %v (type: %T)", role, role)
			}
			if exp, ok := payload["exp"]; ok {
				if expFloat, ok := exp.(float64); ok {
					expTime := time.Unix(int64(expFloat), 0)
					log.Printf("  exp: %v (expires: %v)", exp, expTime)
					log.Printf("  is_expired: %t", time.Now().After(expTime))
				}
			}
		}
	} else {
		log.Printf("❌ Could not decode payload: %v", err)
	}

	log.Printf("🔍 === END JWT STRUCTURE DEBUG ===")
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
