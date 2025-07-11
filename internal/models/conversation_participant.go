package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ParticipantType string

const (
	ParticipantTypeMember ParticipantType = "member"
	ParticipantTypeAdmin  ParticipantType = "admin"
	ParticipantTypeAgent  ParticipantType = "agent"
)

type ConversationParticipant struct {
	ID             uuid.UUID       `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ConversationID uuid.UUID       `json:"conversation_id" gorm:"type:uuid;not null"`
	UserID         uuid.UUID       `json:"user_id" gorm:"type:uuid;not null"`
	UserType       ParticipantType `json:"user_type" gorm:"type:varchar(20);not null"`
	JoinedAt       time.Time       `json:"joined_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	UnreadCount    int             `json:"unread_count" gorm:"not null;default:0"`

	// Relationships
	Conversation *Conversation `json:"conversation,omitempty" gorm:"foreignKey:ConversationID"`
	User         *User         `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName returns the table name for ConversationParticipant model
func (ConversationParticipant) TableName() string {
	return "conversation_participants"
}

// BeforeCreate hook to set ID if not provided
func (cp *ConversationParticipant) BeforeCreate(tx *gorm.DB) error {
	if cp.ID == uuid.Nil {
		cp.ID = uuid.New()
	}
	return nil
}

// IsAdmin checks if participant is admin
func (cp *ConversationParticipant) IsAdmin() bool {
	return cp.UserType == ParticipantTypeAdmin
}

// IsAgent checks if participant is agent
func (cp *ConversationParticipant) IsAgent() bool {
	return cp.UserType == ParticipantTypeAgent
}

// HasUnreadMessages checks if participant has unread messages
func (cp *ConversationParticipant) HasUnreadMessages() bool {
	return cp.UnreadCount > 0
}
