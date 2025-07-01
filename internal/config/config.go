// internal/config/config.go
package config

import (
	"os"
	"time"
)

type Config struct {
	Environment   string
	Port          string
	DatabaseURL   string
	RedisURL      string
	JWTSecret     string
	JWTExpiry     time.Duration
	RefreshExpiry time.Duration
	LogLevel      string
	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPassword  string
	RateLimitRPS  int
	EnableCORS    bool
	CORSOrigins   []string
}

func Load() *Config {
	return &Config{
		Environment:   getEnv("ENVIRONMENT", "development"),
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://user:password@localhost/room_reservation?sslmode=disable"),
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:     getEnv("JWT_SECRET", "your-secret-key"),
		JWTExpiry:     15 * time.Minute,
		RefreshExpiry: 7 * 24 * time.Hour,
		LogLevel:      getEnv("LOG_LEVEL", "info"),
		SMTPHost:      getEnv("SMTP_HOST", "localhost"),
		SMTPPort:      getEnv("SMTP_PORT", "587"),
		SMTPUser:      getEnv("SMTP_USER", ""),
		SMTPPassword:  getEnv("SMTP_PASSWORD", ""),
		RateLimitRPS:  100,
		EnableCORS:    true,
		CORSOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
