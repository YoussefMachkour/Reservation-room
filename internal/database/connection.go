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
		// Core models
		&models.User{},
		&models.Space{},
		&models.Reservation{},
		// &models.Notification{},

		// Chat models - order matters due to foreign key relationships
		&models.Conversation{},
		&models.ConversationParticipant{},
		&models.Message{},
		&models.MessageAttachment{},
		&models.MessageReadReceipt{},
		&models.SupportAgent{},
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

		// Chat indexes - Conversations
		"CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)",
		"CREATE INDEX IF NOT EXISTS idx_conversations_priority ON conversations(priority)",
		"CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent ON conversations(assigned_agent_id)",
		"CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC)",
		"CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived)",
		"CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC)",

		// Chat indexes - Conversation Participants
		"CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id)",
		"CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread_count ON conversation_participants(unread_count)",
		"CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_type ON conversation_participants(user_type)",

		// Chat indexes - Messages
		"CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)",
		"CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)",
		"CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)",
		"CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type)",
		"CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type)",
		"CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC)",

		// Chat indexes - Message Attachments
		"CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id)",
		"CREATE INDEX IF NOT EXISTS idx_message_attachments_file_type ON message_attachments(file_type)",

		// Chat indexes - Message Read Receipts
		"CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id)",
		"CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_message ON message_read_receipts(user_id, message_id)",

		// Chat indexes - Support Agents
		"CREATE INDEX IF NOT EXISTS idx_support_agents_status ON support_agents(status)",
		"CREATE INDEX IF NOT EXISTS idx_support_agents_department ON support_agents(department)",
		"CREATE INDEX IF NOT EXISTS idx_support_agents_rating ON support_agents(rating DESC)",
		"CREATE INDEX IF NOT EXISTS idx_support_agents_last_seen ON support_agents(last_seen_at DESC)",
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

		// Chat constraints - Conversations
		"ALTER TABLE conversations ADD CONSTRAINT IF NOT EXISTS chk_conversation_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))",
		"ALTER TABLE conversations ADD CONSTRAINT IF NOT EXISTS chk_conversation_status CHECK (status IN ('active', 'resolved', 'pending'))",

		// Chat constraints - Conversation Participants
		"ALTER TABLE conversation_participants ADD CONSTRAINT IF NOT EXISTS chk_participant_type CHECK (user_type IN ('member', 'admin', 'agent'))",
		"ALTER TABLE conversation_participants ADD CONSTRAINT IF NOT EXISTS chk_participant_unread_count CHECK (unread_count >= 0)",

		// Chat constraints - Messages
		"ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_message_sender_type CHECK (sender_type IN ('user', 'admin', 'bot'))",
		"ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_message_type CHECK (message_type IN ('text', 'image', 'file', 'video', 'audio', 'booking_confirmation', 'membership_renewal', 'cancellation', 'payment_reminder', 'system_notification'))",
		"ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS chk_message_content_length CHECK (LENGTH(content) > 0)",

		// Chat constraints - Message Attachments
		"ALTER TABLE message_attachments ADD CONSTRAINT IF NOT EXISTS chk_attachment_file_size CHECK (file_size > 0)",
		"ALTER TABLE message_attachments ADD CONSTRAINT IF NOT EXISTS chk_attachment_file_name CHECK (LENGTH(file_name) > 0)",

		// Chat constraints - Support Agents
		"ALTER TABLE support_agents ADD CONSTRAINT IF NOT EXISTS chk_agent_status CHECK (status IN ('online', 'away', 'offline'))",
		"ALTER TABLE support_agents ADD CONSTRAINT IF NOT EXISTS chk_agent_rating CHECK (rating >= 0.0 AND rating <= 5.0)",
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

		// Create function to update conversation last_message_at when a message is added
		`CREATE OR REPLACE FUNCTION update_conversation_last_message() 
			RETURNS TRIGGER AS $$
			BEGIN
			UPDATE conversations 
			SET last_message_at = NEW.created_at 
			WHERE id = NEW.conversation_id;
			RETURN NEW;
			END;
			$$ LANGUAGE plpgsql`,

		`DROP TRIGGER IF EXISTS message_update_conversation_trigger ON messages`,

		`CREATE TRIGGER message_update_conversation_trigger
			AFTER INSERT ON messages
			FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message()`,

		// Create function to update unread counts when a message is added
		`CREATE OR REPLACE FUNCTION update_unread_counts() 
			RETURNS TRIGGER AS $$
			BEGIN
			UPDATE conversation_participants 
			SET unread_count = unread_count + 1 
			WHERE conversation_id = NEW.conversation_id 
			AND user_id != NEW.sender_id;
			RETURN NEW;
			END;
			$$ LANGUAGE plpgsql`,

		`DROP TRIGGER IF EXISTS message_unread_count_trigger ON messages`,

		`CREATE TRIGGER message_unread_count_trigger
			AFTER INSERT ON messages
			FOR EACH ROW EXECUTE FUNCTION update_unread_counts()`,

		// Create function to update unread counts when messages are marked as read
		`CREATE OR REPLACE FUNCTION reset_unread_count() 
			RETURNS TRIGGER AS $$
			BEGIN
			UPDATE conversation_participants 
			SET unread_count = (
				SELECT COUNT(*)
				FROM messages m
				WHERE m.conversation_id = (
					SELECT conversation_id FROM messages WHERE id = NEW.message_id
				)
				AND m.sender_id != NEW.user_id
				AND NOT EXISTS (
					SELECT 1 FROM message_read_receipts mrr 
					WHERE mrr.message_id = m.id AND mrr.user_id = NEW.user_id
				)
			)
			WHERE conversation_id = (
				SELECT conversation_id FROM messages WHERE id = NEW.message_id
			)
			AND user_id = NEW.user_id;
			RETURN NEW;
			END;
			$$ LANGUAGE plpgsql`,

		`DROP TRIGGER IF EXISTS read_receipt_unread_count_trigger ON message_read_receipts`,

		`CREATE TRIGGER read_receipt_unread_count_trigger
			AFTER INSERT ON message_read_receipts
			FOR EACH ROW EXECUTE FUNCTION reset_unread_count()`,
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

		// Create support agent record for admin user
		supportAgent := &models.SupportAgent{
			ID:         adminUser.ID,
			Department: "General Support",
			Status:     models.AgentStatusOffline,
			Rating:     5.0,
		}

		if err := db.Create(supportAgent).Error; err != nil {
			slog.Warn("Failed to create support agent for admin", "error", err)
		} else {
			slog.Info("Default support agent created")
		}
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
