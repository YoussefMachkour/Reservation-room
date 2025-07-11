package models

import (
	"time"

	"github.com/google/uuid"
)

type AgentStatus string

const (
	AgentStatusOnline  AgentStatus = "online"
	AgentStatusAway    AgentStatus = "away"
	AgentStatusOffline AgentStatus = "offline"
)

type SupportAgent struct {
	ID         uuid.UUID   `json:"id" gorm:"type:uuid;primary_key"` // References users(id)
	Department string      `json:"department" gorm:"size:100;not null"`
	Status     AgentStatus `json:"status" gorm:"type:varchar(20);not null;default:'offline'"`
	Rating     float64     `json:"rating" gorm:"type:decimal(3,2);default:0.0"`
	LastSeenAt time.Time   `json:"last_seen_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`

	// Relationships
	User                  *User          `json:"user,omitempty" gorm:"foreignKey:ID"`
	AssignedConversations []Conversation `json:"assigned_conversations,omitempty" gorm:"foreignKey:AssignedAgentID"`
}

// TableName returns the table name for SupportAgent model
func (SupportAgent) TableName() string {
	return "support_agents"
}

// IsOnline checks if agent is online
func (sa *SupportAgent) IsOnline() bool {
	return sa.Status == AgentStatusOnline
}

// IsAvailable checks if agent is available (online or away)
func (sa *SupportAgent) IsAvailable() bool {
	return sa.Status == AgentStatusOnline || sa.Status == AgentStatusAway
}

// GetFullName returns agent's full name from user
func (sa *SupportAgent) GetFullName() string {
	if sa.User != nil {
		return sa.User.GetFullName()
	}
	return ""
}
