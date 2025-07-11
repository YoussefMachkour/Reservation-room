package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageType string
type SenderType string

const (
	MessageTypeText                MessageType = "text"
	MessageTypeImage               MessageType = "image"
	MessageTypeFile                MessageType = "file"
	MessageTypeVideo               MessageType = "video"
	MessageTypeAudio               MessageType = "audio"
	MessageTypeBookingConfirmation MessageType = "booking_confirmation"
	MessageTypeMembershipRenewal   MessageType = "membership_renewal"
	MessageTypeCancellation        MessageType = "cancellation"
	MessageTypePaymentReminder     MessageType = "payment_reminder"
	MessageTypeSystemNotification  MessageType = "system_notification"
)

const (
	SenderTypeUser  SenderType = "user"
	SenderTypeAdmin SenderType = "admin"
	SenderTypeBot   SenderType = "bot"
)

type Message struct {
	ID             uuid.UUID   `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ConversationID uuid.UUID   `json:"conversation_id" gorm:"type:uuid;not null"`
	SenderID       uuid.UUID   `json:"sender_id" gorm:"type:uuid;not null"`
	SenderName     string      `json:"sender_name" gorm:"size:255;not null"`
	SenderType     SenderType  `json:"sender_type" gorm:"type:varchar(20);not null"`
	Content        string      `json:"content" gorm:"type:text;not null"`
	MessageType    MessageType `json:"message_type" gorm:"type:varchar(30);not null;default:'text'"`
	IsEdited       bool        `json:"is_edited" gorm:"not null;default:false"`
	EditedAt       *time.Time  `json:"edited_at"`
	Metadata       *string     `json:"metadata" gorm:"type:jsonb"` // JSON string for booking_id, space_id, payment_id, etc.
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`

	// Relationships
	Conversation *Conversation        `json:"conversation,omitempty" gorm:"foreignKey:ConversationID"`
	Sender       *User                `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Attachments  []MessageAttachment  `json:"attachments,omitempty" gorm:"foreignKey:MessageID"`
	ReadReceipts []MessageReadReceipt `json:"read_receipts,omitempty" gorm:"foreignKey:MessageID"`
}

// TableName returns the table name for Message model
func (Message) TableName() string {
	return "messages"
}

// BeforeCreate hook to set ID if not provided
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// IsTextMessage checks if message is text type
func (m *Message) IsTextMessage() bool {
	return m.MessageType == MessageTypeText
}

// IsSystemMessage checks if message is system generated
func (m *Message) IsSystemMessage() bool {
	return m.SenderType == SenderTypeBot ||
		m.MessageType == MessageTypeSystemNotification ||
		m.MessageType == MessageTypeBookingConfirmation ||
		m.MessageType == MessageTypeMembershipRenewal ||
		m.MessageType == MessageTypeCancellation ||
		m.MessageType == MessageTypePaymentReminder
}

// HasAttachments checks if message has attachments
func (m *Message) HasAttachments() bool {
	return len(m.Attachments) > 0
}
