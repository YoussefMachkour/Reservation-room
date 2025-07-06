package database

import (
"fmt"
"log/slog"
"time"

"gorm.io/driver/postgres"
"gorm.io/gorm"
"gorm.io/gorm/logger"

"room-reservation-api/internal/models"
)

// Connect establishes a connection to the database
func Connect(databaseURL string) (*gorm.DB, error) {
// Configure GORM logger
gormLogger := logger.Default.LogMode(logger.Info)

// Open database connection
db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
	Logger: gormLogger,
	NowFunc: func() time.Time {
		return time.Now().UTC()
	},
})
if err != nil {
	return nil, fmt.Errorf("failed to connect to database: %w", err)
}

// Get underlying SQL database to configure connection pool
sqlDB, err := db.DB()
if err != nil {
	return nil, fmt.Errorf("failed to get underlying database: %w", err)
}

// Configure connection pool
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
sqlDB.SetConnMaxLifetime(time.Hour)

// Test the connection
if err := sqlDB.Ping(); err != nil {
	return nil, fmt.Errorf("failed to ping database: %w", err)
}

// Auto-migrate models
if err := autoMigrate(db); err != nil {
	return nil, fmt.Errorf("failed to migrate database: %w", err)
}

slog.Info("Database connected and migrated successfully")
return db, nil
}

// autoMigrate runs automatic migrations for all models
func autoMigrate(db *gorm.DB) error {
models := []interface{}{
	&models.User{},
	&models.Space{},
	&models.Reservation{},
	// &models.Notification{},
}

for _, model := range models {
	if err := db.AutoMigrate(model); err != nil {
		return fmt.Errorf("failed to migrate %T: %w", model, err)
	}
}

// Create indexes
if err := createIndexes(db); err != nil {
	return fmt.Errorf("failed to create indexes: %w", err)
}

// Create constraints
if err := createConstraints(db); err != nil {
	return fmt.Errorf("failed to create constraints: %w", err)
}

return nil
}

// createIndexes creates additional database indexes for better performance
func createIndexes(db *gorm.DB) error {
indexes := []string{
	// User indexes
	"CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
	"CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
	"CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",

	// Space indexes
	"CREATE INDEX IF NOT EXISTS idx_spaces_type ON spaces(type)",
	"CREATE INDEX IF NOT EXISTS idx_spaces_status ON spaces(status)",
	"CREATE INDEX IF NOT EXISTS idx_spaces_building ON spaces(building)",
	"CREATE INDEX IF NOT EXISTS idx_spaces_capacity ON spaces(capacity)",
	"CREATE INDEX IF NOT EXISTS idx_spaces_manager ON spaces(manager_id)",

	// Reservation indexes
	"CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id)",
	"CREATE INDEX IF NOT EXISTS idx_reservations_space ON reservations(space_id)",
	"CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)",
	"CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time)",
	"CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON reservations(start_time)",
	"CREATE INDEX IF NOT EXISTS idx_reservations_end_time ON reservations(end_time)",
	"CREATE INDEX IF NOT EXISTS idx_reservations_parent ON reservations(recurrence_parent_id)",

	// Notification indexes
	"CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)",
	"CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)",
	"CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)",
	"CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at)",
	"CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)",
}

for _, index := range indexes {
	if err := db.Exec(index).Error; err != nil {
		slog.Warn("Failed to create index", "query", index, "error", err)
	}
}

return nil
}

// createConstraints creates additional database constraints
func createConstraints(db *gorm.DB) error {
constraints := []string{
	// Space constraints
	"ALTER TABLE spaces ADD CONSTRAINT IF NOT EXISTS chk_space_capacity CHECK (capacity > 0 AND capacity <= 1000)",
	"ALTER TABLE spaces ADD CONSTRAINT IF NOT EXISTS chk_space_surface CHECK (surface IS NULL OR surface >= 0)",
	"ALTER TABLE spaces ADD CONSTRAINT IF NOT EXISTS chk_space_prices CHECK (price_per_hour >= 0 AND price_per_day >= 0 AND price_per_month >= 0)",
	"ALTER TABLE spaces ADD CONSTRAINT IF NOT EXISTS chk_space_booking_times CHECK (booking_advance_time >= 0 AND max_booking_duration > 0)",

	// Reservation constraints
	"ALTER TABLE reservations ADD CONSTRAINT IF NOT EXISTS chk_reservation_time CHECK (end_time > start_time)",
	"ALTER TABLE reservations ADD CONSTRAINT IF NOT EXISTS chk_reservation_participants CHECK (participant_count > 0)",

	// Notification constraints
	"ALTER TABLE notifications ADD CONSTRAINT IF NOT EXISTS chk_notification_retry CHECK (retry_count >= 0 AND retry_count <= max_retries)",
}

for _, constraint := range constraints {
	if err := db.Exec(constraint).Error; err != nil {
		slog.Warn("Failed to create constraint", "query", constraint, "error", err)
	}
}

return nil
}

// CreateUniqueConstraints creates unique constraints to prevent conflicts
func CreateUniqueConstraints(db *gorm.DB) error {
uniqueConstraints := []string{
	// Prevent overlapping reservations for the same space
	`CREATE OR REPLACE FUNCTION check_reservation_conflict() 
		RETURNS TRIGGER AS $$
		BEGIN
		IF EXISTS (
			SELECT 1 FROM reservations 
			WHERE space_id = NEW.space_id 
			AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
			AND status IN ('confirmed', 'pending')
			AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
		) THEN
			RAISE EXCEPTION 'Reservation conflicts with existing booking';
		END IF;
		RETURN NEW;
		END;
		$$ LANGUAGE plpgsql`,

	`DROP TRIGGER IF EXISTS reservation_conflict_trigger ON reservations`,

	`CREATE TRIGGER reservation_conflict_trigger
		BEFORE INSERT OR UPDATE ON reservations
		FOR EACH ROW EXECUTE FUNCTION check_reservation_conflict()`,
}

for _, constraint := range uniqueConstraints {
	if err := db.Exec(constraint).Error; err != nil {
		slog.Warn("Failed to create unique constraint", "query", constraint, "error", err)
	}
}

return nil
}

// SeedDatabase seeds the database with initial data
func SeedDatabase(db *gorm.DB) error {
// Check if admin user already exists
var adminCount int64
db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&adminCount)

if adminCount == 0 {
	// Create default admin user
	adminUser := &models.User{
		FirstName:    "Admin",
		LastName:     "User",
		Email:        "admin@cohub.com",
		PasswordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3xr1PG5iOm", // password123
		Role:         models.RoleAdmin,
		IsActive:     true,
		Department:   "IT",
		Position:     "System Administrator",
	}

	if err := db.Create(adminUser).Error; err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	slog.Info("Default admin user created", "email", adminUser.Email)
}

// Seed sample spaces if none exist
var spaceCount int64
db.Model(&models.Space{}).Count(&spaceCount)

if spaceCount == 0 {
	sampleSpaces := []models.Space{
		{
			Name:               "Conference Room A",
			Type:               models.SpaceTypeMeetingRoom,
			Capacity:           10,
			Building:           "Main Building",
			Floor:              1,
			RoomNumber:         "101",
			Description:        "Large conference room with projector and whiteboard",
			Surface:            45.0,
			PricePerHour:       50.0,
			Status:             models.SpaceStatusAvailable,
			RequiresApproval:   true,
			BookingAdvanceTime: 30,
			MaxBookingDuration: 480,
		},
		{
			Name:               "Hot Desk Area",
			Type:               models.SpaceTypeHotDesk,
			Capacity:           4,
			Building:           "Main Building",
			Floor:              2,
			RoomNumber:         "201",
			Description:        "Flexible workspace area with multiple desks",
			Surface:            25.0,
			PricePerHour:       15.0,
			Status:             models.SpaceStatusAvailable,
			RequiresApproval:   false,
			BookingAdvanceTime: 15,
			MaxBookingDuration: 240,
		},
		{
			Name:               "Private Office",
			Type:               models.SpaceTypeOffice,
			Capacity:           2,
			Building:           "East Wing",
			Floor:              3,
			RoomNumber:         "301",
			Description:        "Private office space for focused work",
			Surface:            20.0,
			PricePerDay:        100.0,
			PricePerMonth:      2000.0,
			Status:             models.SpaceStatusAvailable,
			RequiresApproval:   false,
			BookingAdvanceTime: 60,
			MaxBookingDuration: 480,
		},
	}

	for _, space := range sampleSpaces {
		if err := db.Create(&space).Error; err != nil {
			slog.Warn("Failed to create sample space", "name", space.Name, "error", err)
		}
	}

	slog.Info("Sample spaces created", "count", len(sampleSpaces))
}

return nil
}

// CloseConnection closes the database connection
func CloseConnection(db *gorm.DB) error {
sqlDB, err := db.DB()
if err != nil {
	return fmt.Errorf("failed to get underlying database: %w", err)
}

if err := sqlDB.Close(); err != nil {
	return fmt.Errorf("failed to close database connection: %w", err)
}

slog.Info("Database connection closed")
return nil
}
