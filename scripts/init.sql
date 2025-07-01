-- scripts/init.sql
-- Initial database setup for Room Reservation System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE space_type AS ENUM ('meeting_room', 'office', 'auditorium', 'open_space', 'hot_desk', 'conference_room');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE space_status AS ENUM ('available', 'maintenance', 'out_of_service', 'reserved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('confirmed', 'pending', 'cancelled', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('confirmation', 'reminder', 'cancellation', 'modification', 'alert', 'approval', 'welcome');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check reservation conflicts
CREATE OR REPLACE FUNCTION check_reservation_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for confirmed and pending reservations
    IF NEW.status NOT IN ('confirmed', 'pending') THEN
        RETURN NEW;
    END IF;

    -- Check for overlapping reservations
    IF EXISTS (
        SELECT 1 FROM reservations 
        WHERE space_id = NEW.space_id 
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status IN ('confirmed', 'pending')
          AND deleted_at IS NULL
          AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
    ) THEN
        RAISE EXCEPTION 'Reservation conflicts with existing booking for space %', NEW.space_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update space status based on reservations
CREATE OR REPLACE FUNCTION update_space_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If a reservation is confirmed and ongoing, mark space as reserved
    IF NEW.status = 'confirmed' AND NEW.start_time <= NOW() AND NEW.end_time > NOW() THEN
        UPDATE spaces SET status = 'reserved' WHERE id = NEW.space_id;
    END IF;

    -- If reservation ends or is cancelled, check if space should be available
    IF (OLD.status IN ('confirmed', 'pending') AND NEW.status IN ('cancelled', 'completed')) 
       OR (NEW.end_time <= NOW() AND NEW.status = 'completed') THEN
        
        -- Check if there are other active reservations
        IF NOT EXISTS (
            SELECT 1 FROM reservations 
            WHERE space_id = NEW.space_id 
              AND status = 'confirmed' 
              AND start_time <= NOW() 
              AND end_time > NOW()
              AND deleted_at IS NULL
        ) THEN
            -- Only update to available if space is currently reserved
            UPDATE spaces 
            SET status = 'available' 
            WHERE id = NEW.space_id AND status = 'reserved';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate notification for reservation events
CREATE OR REPLACE FUNCTION generate_reservation_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type_val notification_type;
BEGIN
    -- Determine notification type and content based on the operation
    IF TG_OP = 'INSERT' THEN
        notification_type_val := 'confirmation';
        notification_title := 'Reservation Confirmed';
        notification_message := 'Your reservation for ' || (SELECT name FROM spaces WHERE id = NEW.space_id) || ' has been confirmed.';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'confirmed' THEN
                    notification_type_val := 'confirmation';
                    notification_title := 'Reservation Approved';
                    notification_message := 'Your reservation has been approved.';
                WHEN 'cancelled' THEN
                    notification_type_val := 'cancellation';
                    notification_title := 'Reservation Cancelled';
                    notification_message := 'Your reservation has been cancelled.';
                WHEN 'rejected' THEN
                    notification_type_val := 'alert';
                    notification_title := 'Reservation Rejected';
                    notification_message := 'Your reservation request has been rejected.';
                ELSE
                    RETURN NEW;
            END CASE;
        ELSE
            notification_type_val := 'modification';
            notification_title := 'Reservation Updated';
            notification_message := 'Your reservation has been updated.';
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Insert notification
    INSERT INTO notifications (
        user_id, type, channel, title, message, status, created_at, updated_at
    ) VALUES (
        NEW.user_id, 
        notification_type_val, 
        'email', 
        notification_title, 
        notification_message, 
        'pending', 
        NOW(), 
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_spaces_type_status ON spaces(type, status);
CREATE INDEX IF NOT EXISTS idx_spaces_building_floor ON spaces(building, floor);
CREATE INDEX IF NOT EXISTS idx_spaces_capacity_status ON spaces(capacity, status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_space_time ON reservations(space_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_time_status ON reservations(start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_type_status ON notifications(type, status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_spaces_search ON spaces USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));

-- Create sample data if in development mode
DO $$
BEGIN
    -- Insert default admin user if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@cohub.com') THEN
        INSERT INTO users (
            id, first_name, last_name, email, password_hash, role, is_active, 
            department, position, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            'Admin',
            'User',
            'admin@cohub.com',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3xr1PG5iOm', -- password123
            'admin',
            true,
            'IT',
            'System Administrator',
            NOW(),
            NOW()
        );
    END IF;

    -- Insert sample manager if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@cohub.com') THEN
        INSERT INTO users (
            id, first_name, last_name, email, password_hash, role, is_active, 
            department, position, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            'John',
            'Manager',
            'manager@cohub.com',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3xr1PG5iOm', -- password123
            'manager',
            true,
            'Operations',
            'Space Manager',
            NOW(),
            NOW()
        );
    END IF;

    -- Insert sample regular user if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@cohub.com') THEN
        INSERT INTO users (
            id, first_name, last_name, email, password_hash, role, is_active, 
            department, position, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            'Jane',
            'Doe',
            'user@cohub.com',
            '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3xr1PG5iOm', -- password123
            'user',
            true,
            'Development',
            'Software Developer',
            NOW(),
            NOW()
        );
    END IF;
END $$;