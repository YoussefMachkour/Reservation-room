package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageReadReceipt struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	MessageID uuid.UUID `json:"message_id" gorm:"type:uuid;not null"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	ReadAt    time.Time `json:"read_at" gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relationships
	Message *Message `json:"message,omitempty" gorm:"foreignKey:MessageID"`
	User    *User    `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName returns the table name for MessageReadReceipt model
func (MessageReadReceipt) TableName() string {
	return "message_read_receipts"
}

// BeforeCreate hook to set ID if not provided
func (mrr *MessageReadReceipt) BeforeCreate(tx *gorm.DB) error {
	if mrr.ID == uuid.Nil {
		mrr.ID = uuid.New()
	}
	return nil
}
