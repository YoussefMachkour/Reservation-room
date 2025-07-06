// internal/config/config.go
package config

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Environment            string
	Port                   string
	DatabaseURL            string
	RedisURL               string
	JWTSecret              string
	JWTExpiry              time.Duration
	RefreshExpiry          time.Duration
	LogLevel               string
	SMTPHost               string
	SMTPPort               string
	SMTPUser               string
	SMTPPassword           string
	SMTPFrom               string
	RateLimitRPS           int
	EnableCORS             bool
	CORSOrigins            []string
	MaxUploadSize          int64
	UploadPath             string
	NotificationRetryCount int
	NotificationRetryDelay time.Duration
	MinBookingAdvanceTime  int
	MaxBookingDuration     int
	DefaultBookingDuration int
	CacheTTL               int
	WebhookURL             string
	SlackWebhookURL        string
	Debug                  bool
	PrettyLogs             bool
}

func Load() *Config {
	// Set config file name and paths
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("$HOME")

	// Enable environment variable reading
	viper.AutomaticEnv()

	// Set default values
	setDefaults()

	// Read config file (optional - won't fail if not found)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("Config file not found, using environment variables and defaults")
		} else {
			log.Printf("Error reading config file: %v", err)
		}
	}

	return &Config{
		Environment:            viper.GetString("ENVIRONMENT"),
		Port:                   viper.GetString("PORT"),
		DatabaseURL:            viper.GetString("DATABASE_URL"),
		RedisURL:               viper.GetString("REDIS_URL"),
		JWTSecret:              viper.GetString("JWT_SECRET"),
		JWTExpiry:              viper.GetDuration("JWT_EXPIRY"),
		RefreshExpiry:          viper.GetDuration("REFRESH_TOKEN_EXPIRY"),
		LogLevel:               viper.GetString("LOG_LEVEL"),
		SMTPHost:               viper.GetString("SMTP_HOST"),
		SMTPPort:               viper.GetString("SMTP_PORT"),
		SMTPUser:               viper.GetString("SMTP_USER"),
		SMTPPassword:           viper.GetString("SMTP_PASSWORD"),
		SMTPFrom:               viper.GetString("SMTP_FROM"),
		RateLimitRPS:           viper.GetInt("RATE_LIMIT_RPS"),
		EnableCORS:             viper.GetBool("ENABLE_CORS"),
		CORSOrigins:            parseCORSOrigins(viper.GetString("CORS_ORIGINS")),
		MaxUploadSize:          viper.GetInt64("MAX_UPLOAD_SIZE"),
		UploadPath:             viper.GetString("UPLOAD_PATH"),
		NotificationRetryCount: viper.GetInt("NOTIFICATION_RETRY_COUNT"),
		NotificationRetryDelay: viper.GetDuration("NOTIFICATION_RETRY_DELAY"),
		MinBookingAdvanceTime:  viper.GetInt("MIN_BOOKING_ADVANCE_TIME"),
		MaxBookingDuration:     viper.GetInt("MAX_BOOKING_DURATION"),
		DefaultBookingDuration: viper.GetInt("DEFAULT_BOOKING_DURATION"),
		CacheTTL:               viper.GetInt("CACHE_TTL"),
		WebhookURL:             viper.GetString("WEBHOOK_URL"),
		SlackWebhookURL:        viper.GetString("SLACK_WEBHOOK_URL"),
		Debug:                  viper.GetBool("DEBUG"),
		PrettyLogs:             viper.GetBool("PRETTY_LOGS"),
	}
}

func setDefaults() {
	// Application defaults
	viper.SetDefault("ENVIRONMENT", "development")
	viper.SetDefault("PORT", "8080")

	// Database defaults
	viper.SetDefault("DATABASE_URL", "postgres://user:password@localhost/room_reservation?sslmode=disable")
	viper.SetDefault("REDIS_URL", "redis://localhost:6379")

	// JWT defaults
	viper.SetDefault("JWT_SECRET", "your-secret-key")
	viper.SetDefault("JWT_EXPIRY", "15m")
	viper.SetDefault("REFRESH_TOKEN_EXPIRY", "168h") // 7 days

	// Logging defaults
	viper.SetDefault("LOG_LEVEL", "info")

	// SMTP defaults
	viper.SetDefault("SMTP_HOST", "localhost")
	viper.SetDefault("SMTP_PORT", "587")
	viper.SetDefault("SMTP_USER", "")
	viper.SetDefault("SMTP_PASSWORD", "")
	viper.SetDefault("SMTP_FROM", "noreply@cohub.com")

	// Rate limiting defaults
	viper.SetDefault("RATE_LIMIT_RPS", 100)

	// CORS defaults
	viper.SetDefault("ENABLE_CORS", true)
	viper.SetDefault("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")

	// File upload defaults
	viper.SetDefault("MAX_UPLOAD_SIZE", 10485760) // 10MB
	viper.SetDefault("UPLOAD_PATH", "./uploads")

	// Notification defaults
	viper.SetDefault("NOTIFICATION_RETRY_COUNT", 3)
	viper.SetDefault("NOTIFICATION_RETRY_DELAY", "5m")

	// Booking rule defaults
	viper.SetDefault("MIN_BOOKING_ADVANCE_TIME", 30)
	viper.SetDefault("MAX_BOOKING_DURATION", 480)
	viper.SetDefault("DEFAULT_BOOKING_DURATION", 120)

	// Cache defaults
	viper.SetDefault("CACHE_TTL", 3600)

	// External service defaults
	viper.SetDefault("WEBHOOK_URL", "")
	viper.SetDefault("SLACK_WEBHOOK_URL", "")

	// Development defaults
	viper.SetDefault("DEBUG", false)
	viper.SetDefault("PRETTY_LOGS", false)
}

func parseCORSOrigins(origins string) []string {
	if origins == "" {
		return []string{"http://localhost:3000", "http://localhost:5173"}
	}

	// Split by comma and trim whitespace
	originList := strings.Split(origins, ",")
	for i, origin := range originList {
		originList[i] = strings.TrimSpace(origin)
	}

	return originList
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	// Add validation logic here if needed
	if c.JWTSecret == "your-secret-key" && c.Environment == "production" {
		return fmt.Errorf("JWT_SECRET must be set in production environment")
	}

	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}

	return nil
}
