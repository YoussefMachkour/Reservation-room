// internal/dto/chat_responses.go
package dto

import (
	"time"

	"github.com/google/uuid"
)

// MessageResponse represents a message in API responses
type ChatMessageResponse struct {
	ID             uuid.UUID              `json:"id"`
	ConversationID uuid.UUID              `json:"conversation_id"`
	SenderID       uuid.UUID              `json:"sender_id"`
	SenderName     string                 `json:"sender_name"`
	SenderType     string                 `json:"sender_type"`
	Content        string                 `json:"content"`
	Type           string                 `json:"type"`
	IsRead         bool                   `json:"is_read"`
	IsEdited       bool                   `json:"is_edited"`
	EditedAt       *time.Time             `json:"edited_at,omitempty"`
	Attachments    []AttachmentResponse   `json:"attachments,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	ReplyToID      *uuid.UUID             `json:"reply_to_id,omitempty"`
	Timestamp      time.Time              `json:"timestamp"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

// AttachmentResponse represents a file attachment in API responses
type AttachmentResponse struct {
	ID           uuid.UUID `json:"id"`
	MessageID    uuid.UUID `json:"message_id"`
	FileName     string    `json:"file_name"`
	FileSize     int64     `json:"file_size"`
	FileType     string    `json:"file_type"`
	FileURL      string    `json:"file_url"`
	ThumbnailURL *string   `json:"thumbnail_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// ConversationParticipantResponse represents a conversation participant
type ConversationParticipantResponse struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	UserType    string    `json:"user_type"`
	JoinedAt    time.Time `json:"joined_at"`
	UnreadCount int       `json:"unread_count"`
	User        UserInfo  `json:"user"`
}

// UserInfo represents basic user information
type UserInfo struct {
	ID             uuid.UUID  `json:"id"`
	FirstName      string     `json:"first_name"`
	LastName       string     `json:"last_name"`
	Email          string     `json:"email"`
	Role           string     `json:"role"`
	ProfilePicture string     `json:"profile_picture,omitempty"`
	Department     string     `json:"department,omitempty"`
	Position       string     `json:"position,omitempty"`
	IsActive       bool       `json:"is_active"`
	LastLoginAt    *time.Time `json:"last_login_at,omitempty"`
}

// ConversationResponse represents a conversation in API responses
type ConversationResponse struct {
	ID              uuid.UUID                         `json:"id"`
	Title           *string                           `json:"title,omitempty"`
	Participants    []ConversationParticipantResponse `json:"participants"`
	LastMessage     *ChatMessageResponse              `json:"last_message,omitempty"`
	LastMessageAt   time.Time                         `json:"last_message_at"`
	UnreadCount     int                               `json:"unread_count"`
	IsArchived      bool                              `json:"is_archived"`
	Tags            []string                          `json:"tags,omitempty"`
	Priority        string                            `json:"priority"`
	Status          string                            `json:"status"`
	AssignedAgentID *uuid.UUID                        `json:"assigned_agent_id,omitempty"`
	AssignedAgent   *SupportAgentInfo                 `json:"assigned_agent,omitempty"`
	CreatedAt       time.Time                         `json:"created_at"`
	UpdatedAt       time.Time                         `json:"updated_at"`
}

// SupportAgentInfo represents basic support agent information
type SupportAgentInfo struct {
	ID         uuid.UUID `json:"id"`
	Department string    `json:"department"`
	Status     string    `json:"status"`
	Rating     float64   `json:"rating"`
	LastSeenAt time.Time `json:"last_seen_at"`
	User       UserInfo  `json:"user"`
}

// ConversationListResponse represents a paginated list of conversations
type ConversationListResponse struct {
	Conversations []ConversationResponse `json:"conversations"`
	TotalCount    int64                  `json:"total_count"`
	UnreadCount   int64                  `json:"unread_count"`
	HasMore       bool                   `json:"has_more"`
	NextOffset    *int                   `json:"next_offset,omitempty"`
}

// MessageListResponse represents a paginated list of messages
type MessageListResponse struct {
	Messages   []ChatMessageResponse `json:"messages"`
	TotalCount int64                 `json:"total_count"`
	HasMore    bool                  `json:"has_more"`
	NextCursor *string               `json:"next_cursor,omitempty"`
	PrevCursor *string               `json:"prev_cursor,omitempty"`
}

// ReadReceiptResponse represents a message read receipt
type ReadReceiptResponse struct {
	ID        uuid.UUID `json:"id"`
	MessageID uuid.UUID `json:"message_id"`
	UserID    uuid.UUID `json:"user_id"`
	User      UserInfo  `json:"user"`
	ReadAt    time.Time `json:"read_at"`
}

// TypingStatusResponse represents typing status information
type TypingStatusResponse struct {
	ConversationID uuid.UUID `json:"conversation_id"`
	UserID         uuid.UUID `json:"user_id"`
	User           UserInfo  `json:"user"`
	IsTyping       bool      `json:"is_typing"`
	Timestamp      time.Time `json:"timestamp"`
}

// SupportAgentResponse represents a support agent in API responses
type SupportAgentResponse struct {
	ID         uuid.UUID `json:"id"`
	Department string    `json:"department"`
	Status     string    `json:"status"`
	Rating     float64   `json:"rating"`
	LastSeenAt time.Time `json:"last_seen_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	User       UserInfo  `json:"user"`
}

// SupportAgentListResponse represents a paginated list of support agents
type SupportAgentListResponse struct {
	Agents     []SupportAgentResponse `json:"agents"`
	TotalCount int64                  `json:"total_count"`
	HasMore    bool                   `json:"has_more"`
}

// ConversationStatsResponse represents conversation statistics
type ConversationStatsResponse struct {
	TotalConversations    int64                    `json:"total_conversations"`
	ActiveConversations   int64                    `json:"active_conversations"`
	ResolvedConversations int64                    `json:"resolved_conversations"`
	PendingConversations  int64                    `json:"pending_conversations"`
	TotalMessages         int64                    `json:"total_messages"`
	AverageResponseTime   float64                  `json:"average_response_time_minutes"`
	ConversationsByDay    []DailyConversationStats `json:"conversations_by_day,omitempty"`
	ConversationsByAgent  []AgentConversationStats `json:"conversations_by_agent,omitempty"`
}

// DailyConversationStats represents daily conversation statistics
type DailyConversationStats struct {
	Date                  string `json:"date"`
	NewConversations      int64  `json:"new_conversations"`
	ResolvedConversations int64  `json:"resolved_conversations"`
	TotalMessages         int64  `json:"total_messages"`
}

// AgentConversationStats represents agent-specific conversation statistics
type AgentConversationStats struct {
	AgentID               uuid.UUID `json:"agent_id"`
	AgentName             string    `json:"agent_name"`
	Department            string    `json:"department"`
	AssignedConversations int64     `json:"assigned_conversations"`
	ResolvedConversations int64     `json:"resolved_conversations"`
	TotalMessages         int64     `json:"total_messages"`
	AverageResponseTime   float64   `json:"average_response_time_minutes"`
	Rating                float64   `json:"rating"`
}

// MessageSearchResponse represents search results for messages
type MessageSearchResponse struct {
	Messages   []MessageSearchResult `json:"messages"`
	TotalCount int64                 `json:"total_count"`
	HasMore    bool                  `json:"has_more"`
}

// MessageSearchResult represents a single message search result
type MessageSearchResult struct {
	Message      ChatMessageResponse  `json:"message"`
	Conversation ConversationResponse `json:"conversation"`
	Highlights   []string             `json:"highlights,omitempty"`
	Score        float64              `json:"score,omitempty"`
}

// FileUploadResponse represents the response after file upload
type FileUploadResponse struct {
	FileURL      string `json:"file_url"`
	ThumbnailURL string `json:"thumbnail_url,omitempty"`
	FileName     string `json:"file_name"`
	FileSize     int64  `json:"file_size"`
	FileType     string `json:"file_type"`
}

// OnlineUsersResponse represents currently online users
type OnlineUsersResponse struct {
	Users      []UserInfo `json:"users"`
	TotalCount int        `json:"total_count"`
}

// ConversationSummaryResponse represents a conversation summary
type ConversationSummaryResponse struct {
	ConversationID   uuid.UUID `json:"conversation_id"`
	MessageCount     int64     `json:"message_count"`
	ParticipantCount int       `json:"participant_count"`
	StartedAt        time.Time `json:"started_at"`
	LastActivityAt   time.Time `json:"last_activity_at"`
	Duration         string    `json:"duration"`
	Status           string    `json:"status"`
	Priority         string    `json:"priority"`
	Tags             []string  `json:"tags,omitempty"`
}

// WebSocketMessage represents a WebSocket message structure
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	ID        *uuid.UUID  `json:"id,omitempty"`
}

// WebSocketEvent types
const (
	WSEventMessageSent         = "message_sent"
	WSEventMessageRead         = "message_read"
	WSEventMessageUpdated      = "message_updated"
	WSEventUserTyping          = "user_typing"
	WSEventUserStoppedTyping   = "user_stopped_typing"
	WSEventUserOnline          = "user_online"
	WSEventUserOffline         = "user_offline"
	WSEventConversationUpdated = "conversation_updated"
	WSEventParticipantJoined   = "participant_joined"
	WSEventParticipantLeft     = "participant_left"
	WSEventAgentAssigned       = "agent_assigned"
	WSEventError               = "error"
	WSEventConnected           = "connected"
	WSEventDisconnected        = "disconnected"
)
