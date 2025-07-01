// internal/models/space.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type SpaceType string
type SpaceStatus string

const (
	SpaceTypeMeetingRoom SpaceType = "meeting_room"
	SpaceTypeOffice      SpaceType = "office"
	SpaceTypeAuditorium  SpaceType = "auditorium"
	SpaceTypeOpenSpace   SpaceType = "open_space"
	SpaceTypeHotDesk     SpaceType = "hot_desk"
	SpaceTypeConference  SpaceType = "conference_room"

	SpaceStatusAvailable    SpaceStatus = "available"
	SpaceStatusMaintenance  SpaceStatus = "maintenance"
	SpaceStatusOutOfService SpaceStatus = "out_of_service"
	SpaceStatusReserved     SpaceStatus = "reserved"
)

type Equipment struct {
	Name        string `json:"name"`
	Quantity    int    `json:"quantity"`
	Description string `json:"description,omitempty"`
}

type Space struct {
	ID                 uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name               string         `json:"name" gorm:"not null;size:100;uniqueIndex:idx_space_building_name" validate:"required,min=2,max=100"`
	Type               SpaceType      `json:"type" gorm:"type:varchar(50);not null" validate:"required"`
	Capacity           int            `json:"capacity" gorm:"not null;check:capacity > 0" validate:"required,min=1,max=1000"`
	Building           string         `json:"building" gorm:"not null;size:50;uniqueIndex:idx_space_building_name" validate:"required"`
	Floor              int            `json:"floor" gorm:"not null" validate:"required"`
	RoomNumber         string         `json:"room_number" gorm:"not null;size:20" validate:"required"`
	Equipment          datatypes.JSON `json:"equipment" gorm:"type:jsonb"`
	Status             SpaceStatus    `json:"status" gorm:"type:varchar(20);default:'available'"`
	Description        string         `json:"description" gorm:"type:text"`
	Surface            float64        `json:"surface" validate:"omitempty,min=0"`
	Photos             datatypes.JSON `json:"photos" gorm:"type:jsonb"`
	PricePerHour       float64        `json:"price_per_hour" gorm:"default:0" validate:"omitempty,min=0"`
	PricePerDay        float64        `json:"price_per_day" gorm:"default:0" validate:"omitempty,min=0"`
	PricePerMonth      float64        `json:"price_per_month" gorm:"default:0" validate:"omitempty,min=0"`
	ManagerID          *uuid.UUID     `json:"manager_id" gorm:"type:uuid"`
	RequiresApproval   bool           `json:"requires_approval" gorm:"default:false"`
	BookingAdvanceTime int            `json:"booking_advance_time" gorm:"default:30"`  // minutes
	MaxBookingDuration int            `json:"max_booking_duration" gorm:"default:480"` // minutes (8 hours)
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Manager      *User         `json:"manager,omitempty" gorm:"foreignKey:ManagerID"`
	Reservations []Reservation `json:"reservations,omitempty" gorm:"foreignKey:SpaceID"`
}

// TableName returns the table name for Space model
func (Space) TableName() string {
	return "spaces"
}

// BeforeCreate hook to set ID if not provided
func (s *Space) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// IsAvailable checks if space is available for booking
func (s *Space) IsAvailable() bool {
	return s.Status == SpaceStatusAvailable
}

// GetFullLocation returns the full location string
func (s *Space) GetFullLocation() string {
	return s.Building + " - Floor " + string(rune(s.Floor)) + " - Room " + s.RoomNumber
}

// GetEquipmentList returns the equipment as a slice
func (s *Space) GetEquipmentList() []Equipment {
	var equipment []Equipment
	if s.Equipment != nil {
		// Parse JSON to equipment slice
		// Implementation depends on your JSON structure
	}
	return equipment
}

// GetPhotoURLs returns the photo URLs as a slice
func (s *Space) GetPhotoURLs() []string {
	var photos []string
	if s.Photos != nil {
		// Parse JSON to string slice
		// Implementation depends on your JSON structure
	}
	return photos
}

// CanBeBookedBy checks if a user can book this space
func (s *Space) CanBeBookedBy(user *User) bool {
	if !s.IsAvailable() {
		return false
	}

	// Add business logic for booking permissions
	// For example, some spaces might be restricted to certain roles

	return true
}
