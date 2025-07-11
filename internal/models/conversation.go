package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type ConversationStatus string
type ConversationPriority string

const (
	ConversationStatusActive   ConversationStatus = "active"
	ConversationStatusResolved ConversationStatus = "resolved"
	ConversationStatusPending  ConversationStatus = "pending"
)

const (
	ConversationPriorityLow    ConversationPriority = "low"
	ConversationPriorityNormal ConversationPriority = "normal"
	ConversationPriorityHigh   ConversationPriority = "high"
	ConversationPriorityUrgent ConversationPriority = "urgent"
)

type Conversation struct {
	ID              uuid.UUID            `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Title           *string              `json:"title" gorm:"size:255"`
	Priority        ConversationPriority `json:"priority" gorm:"type:varchar(20);not null;default:'normal'"`
	Status          ConversationStatus   `json:"status" gorm:"type:varchar(20);not null;default:'active'"`
	IsArchived      bool                 `json:"is_archived" gorm:"not null;default:false"`
	AssignedAgentID *uuid.UUID           `json:"assigned_agent_id" gorm:"type:uuid"`
	Tags            pq.StringArray       `json:"tags" gorm:"type:text[]"`
	CreatedAt       time.Time            `json:"created_at"`
	UpdatedAt       time.Time            `json:"updated_at"`
	LastMessageAt   time.Time            `json:"last_message_at" gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relationships
	Participants  []ConversationParticipant `json:"participants,omitempty" gorm:"foreignKey:ConversationID"`
	Messages      []Message                 `json:"messages,omitempty" gorm:"foreignKey:ConversationID"`
	AssignedAgent *User                     `json:"assigned_agent,omitempty" gorm:"foreignKey:AssignedAgentID"`
}

// TableName returns the table name for Conversation model
func (Conversation) TableName() string {
	return "conversations"
}

// BeforeCreate hook to set ID if not provided
func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// IsActive checks if conversation is active
func (c *Conversation) IsActive() bool {
	return c.Status == ConversationStatusActive
}

// IsHighPriority checks if conversation has high or urgent priority
func (c *Conversation) IsHighPriority() bool {
	return c.Priority == ConversationPriorityHigh || c.Priority == ConversationPriorityUrgent
}
