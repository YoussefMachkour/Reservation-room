// internal/dto/chat_requests.go
package dto

import (
	"github.com/google/uuid"
)

// CreateConversationRequest represents the request to create a new conversation
type CreateConversationRequest struct {
	ParticipantIDs []uuid.UUID            `json:"participant_ids" binding:"required,min=1" validate:"required,min=1"`
	Subject        *string                `json:"subject,omitempty" validate:"omitempty,max=255"`
	Priority       string                 `json:"priority" binding:"omitempty,oneof=low normal high urgent" validate:"omitempty,oneof=low normal high urgent"`
	InitialMessage *SendMessageRequest    `json:"initial_message,omitempty"`
	Tags           []string               `json:"tags,omitempty" validate:"omitempty,dive,max=50"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// SendMessageRequest represents the request to send a message
type SendMessageRequest struct {
	ConversationID uuid.UUID              `json:"conversation_id" binding:"required" validate:"required"`
	Content        string                 `json:"content" binding:"required,min=1,max=5000" validate:"required,min=1,max=5000"`
	Type           string                 `json:"type" binding:"required,oneof=text image file video audio booking_confirmation membership_renewal cancellation payment_reminder system_notification" validate:"required"`
	Attachments    []AttachmentRequest    `json:"attachments,omitempty" validate:"omitempty,dive"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	ReplyToID      *uuid.UUID             `json:"reply_to_id,omitempty"`
}

// AttachmentRequest represents a file attachment in a message
type AttachmentRequest struct {
	FileName     string `json:"file_name" binding:"required,max=255" validate:"required,max=255"`
	FileSize     int64  `json:"file_size" binding:"required,min=1,max=52428800" validate:"required,min=1,max=52428800"` // 50MB max
	FileType     string `json:"file_type" binding:"required,max=100" validate:"required,max=100"`
	FileURL      string `json:"file_url" binding:"required,url" validate:"required,url"`
	ThumbnailURL string `json:"thumbnail_url,omitempty" validate:"omitempty,url"`
}

// UpdateConversationRequest represents the request to update a conversation
type UpdateConversationRequest struct {
	Status          *string    `json:"status,omitempty" binding:"omitempty,oneof=active resolved pending" validate:"omitempty,oneof=active resolved pending"`
	Priority        *string    `json:"priority,omitempty" binding:"omitempty,oneof=low normal high urgent" validate:"omitempty,oneof=low normal high urgent"`
	AssignedAgentID *uuid.UUID `json:"assigned_agent_id,omitempty"`
	Tags            *[]string  `json:"tags,omitempty" validate:"omitempty,dive,max=50"`
	IsArchived      *bool      `json:"is_archived,omitempty"`
	Title           *string    `json:"title,omitempty" validate:"omitempty,max=255"`
}

// MarkMessagesReadRequest represents the request to mark messages as read
type MarkMessagesReadRequest struct {
	MessageIDs []uuid.UUID `json:"message_ids" binding:"required,min=1" validate:"required,min=1,dive,required"`
}

// GetConversationsRequest represents the request to get conversations with filters
type GetConversationsRequest struct {
	Status     string `form:"status" validate:"omitempty,oneof=active resolved pending"`
	Priority   string `form:"priority" validate:"omitempty,oneof=low normal high urgent"`
	IsArchived *bool  `form:"is_archived"`
	Tag        string `form:"tag" validate:"omitempty,max=50"`
	Search     string `form:"search" validate:"omitempty,max=100"`
	Limit      int    `form:"limit" validate:"omitempty,min=1,max=100"`
	Offset     int    `form:"offset" validate:"omitempty,min=0"`
	SortBy     string `form:"sort_by" validate:"omitempty,oneof=created_at updated_at last_message_at"`
	SortOrder  string `form:"sort_order" validate:"omitempty,oneof=asc desc"`
}

// GetMessagesRequest represents the request to get messages with pagination
type GetMessagesRequest struct {
	ConversationID uuid.UUID `uri:"conversation_id" binding:"required" validate:"required"`
	Limit          int       `form:"limit" validate:"omitempty,min=1,max=100"`
	Offset         int       `form:"offset" validate:"omitempty,min=0"`
	Before         *string   `form:"before"` // Cursor-based pagination - timestamp
	After          *string   `form:"after"`  // Cursor-based pagination - timestamp
	MessageType    string    `form:"message_type" validate:"omitempty,oneof=text image file video audio booking_confirmation membership_renewal cancellation payment_reminder system_notification"`
}

// UpdateMessageRequest represents the request to update/edit a message
type UpdateMessageRequest struct {
	Content string `json:"content" binding:"required,min=1,max=5000" validate:"required,min=1,max=5000"`
}

// AddParticipantRequest represents the request to add a participant to conversation
type AddParticipantRequest struct {
	UserID   uuid.UUID `json:"user_id" binding:"required" validate:"required"`
	UserType string    `json:"user_type" binding:"required,oneof=member admin agent" validate:"required,oneof=member admin agent"`
}

// RemoveParticipantRequest represents the request to remove a participant
type RemoveParticipantRequest struct {
	UserID uuid.UUID `json:"user_id" binding:"required" validate:"required"`
}

// SetTypingStatusRequest represents the request to set typing status
type SetTypingStatusRequest struct {
	ConversationID uuid.UUID `json:"conversation_id" binding:"required" validate:"required"`
	IsTyping       bool      `json:"is_typing"`
}

// CreateSupportAgentRequest represents the request to create a support agent
type CreateSupportAgentRequest struct {
	UserID     uuid.UUID `json:"user_id" binding:"required" validate:"required"`
	Department string    `json:"department" binding:"required,min=1,max=100" validate:"required,min=1,max=100"`
}

// UpdateSupportAgentRequest represents the request to update a support agent
type UpdateSupportAgentRequest struct {
	Department *string `json:"department,omitempty" validate:"omitempty,min=1,max=100"`
	Status     *string `json:"status,omitempty" binding:"omitempty,oneof=online away offline" validate:"omitempty,oneof=online away offline"`
}

// SearchMessagesRequest represents the request to search messages
type SearchMessagesRequest struct {
	Query          string     `form:"query" binding:"required,min=1,max=100" validate:"required,min=1,max=100"`
	ConversationID *uuid.UUID `form:"conversation_id"`
	MessageType    string     `form:"message_type" validate:"omitempty,oneof=text image file video audio booking_confirmation membership_renewal cancellation payment_reminder system_notification"`
	SenderID       *uuid.UUID `form:"sender_id"`
	StartDate      *string    `form:"start_date" validate:"omitempty,datetime=2006-01-02"`
	EndDate        *string    `form:"end_date" validate:"omitempty,datetime=2006-01-02"`
	Limit          int        `form:"limit" validate:"omitempty,min=1,max=50"`
	Offset         int        `form:"offset" validate:"omitempty,min=0"`
}

// FileUploadRequest represents the request for file upload (for attachments)
type FileUploadRequest struct {
	ConversationID uuid.UUID `form:"conversation_id" binding:"required" validate:"required"`
	FileType       string    `form:"file_type" binding:"required" validate:"required"`
	FileName       string    `form:"file_name" binding:"required,max=255" validate:"required,max=255"`
}

// AssignAgentRequest represents the request to assign an agent to conversation
type AssignAgentRequest struct {
	AgentID uuid.UUID `json:"agent_id" binding:"required" validate:"required"`
}

// ConversationStatsRequest represents the request to get conversation statistics
type ConversationStatsRequest struct {
	StartDate  *string    `form:"start_date" validate:"omitempty,datetime=2006-01-02"`
	EndDate    *string    `form:"end_date" validate:"omitempty,datetime=2006-01-02"`
	AgentID    *uuid.UUID `form:"agent_id"`
	Department string     `form:"department" validate:"omitempty,max=100"`
	GroupBy    string     `form:"group_by" validate:"omitempty,oneof=day week month agent department"`
}
