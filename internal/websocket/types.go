package websocket

import (
	"time"

	"github.com/google/uuid"
)

// WebSocket event types
const (
	// Message events
	WSEventMessageSent    = "message_sent"
	WSEventMessageUpdated = "message_updated"
	WSEventMessageDeleted = "message_deleted"
	WSEventMessageRead    = "message_read"

	// Conversation events
	WSEventConversationCreated  = "conversation_created"
	WSEventConversationUpdated  = "conversation_updated"
	WSEventConversationArchived = "conversation_archived"

	// User events
	WSEventUserTyping  = "user_typing"
	WSEventUserOnline  = "user_online"
	WSEventUserOffline = "user_offline"
	WSEventUserJoined  = "user_joined"
	WSEventUserLeft    = "user_left"

	// System events
	WSEventError     = "error"
	WSEventHeartbeat = "heartbeat"
	WSEventAck       = "ack"
)

// WebSocket message types
const (
	// Control messages
	MessageTypeHeartbeat = "heartbeat"
	MessageTypeAuth      = "auth"
	MessageTypeJoin      = "join"
	MessageTypeLeave     = "leave"
	MessageTypeTyping    = "typing"

	// Data messages
	MessageTypeChat  = "chat"
	MessageTypeEvent = "event"
	MessageTypeError = "error"
	MessageTypeAck   = "ack"
)

// Connection states
const (
	ConnectionStateConnecting   = "connecting"
	ConnectionStateConnected    = "connected"
	ConnectionStateTyping       = "typing"
	ConnectionStateIdle         = "idle"
	ConnectionStateDisconnected = "disconnected"
)

// WebSocket configuration constants
const (
	// Connection limits
	MaxConnections  = 10000
	MaxRoomsPerUser = 100

	// Message limits
	MaxMessageSize = 4096
	MaxQueueSize   = 256

	// Timeouts
	WriteTimeout      = 10 * time.Second
	ReadTimeout       = 60 * time.Second
	HeartbeatInterval = 30 * time.Second
	PongTimeout       = 60 * time.Second

	// Typing indicator timeout
	TypingTimeout = 5 * time.Second
)

// WSMessage represents a WebSocket message
type WSMessage struct {
	ID             string      `json:"id"`
	Type           string      `json:"type"`
	Event          string      `json:"event,omitempty"`
	ConversationID *uuid.UUID  `json:"conversation_id,omitempty"`
	Data           interface{} `json:"data,omitempty"`
	Timestamp      time.Time   `json:"timestamp"`
	UserID         *uuid.UUID  `json:"user_id,omitempty"`
	Error          *WSError    `json:"error,omitempty"`
}

// WSError represents WebSocket error information
type WSError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// WSAuthMessage represents authentication message
type WSAuthMessage struct {
	Token string `json:"token"`
}

// WSJoinMessage represents room join message
type WSJoinMessage struct {
	ConversationID uuid.UUID `json:"conversation_id"`
}

// WSLeaveMessage represents room leave message
type WSLeaveMessage struct {
	ConversationID uuid.UUID `json:"conversation_id"`
}

// WSTypingMessage represents typing indicator message
type WSTypingMessage struct {
	ConversationID uuid.UUID `json:"conversation_id"`
	IsTyping       bool      `json:"is_typing"`
}

// WSHeartbeatMessage represents heartbeat message
type WSHeartbeatMessage struct {
	Timestamp time.Time `json:"timestamp"`
}

// ConnectionInfo represents client connection information
type ConnectionInfo struct {
	UserID       uuid.UUID              `json:"user_id"`
	ConnectionID string                 `json:"connection_id"`
	ConnectedAt  time.Time              `json:"connected_at"`
	LastActivity time.Time              `json:"last_activity"`
	State        string                 `json:"state"`
	Rooms        map[uuid.UUID]bool     `json:"rooms"` // conversation_id -> joined
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// PresenceInfo represents user presence information
type PresenceInfo struct {
	UserID          uuid.UUID `json:"user_id"`
	IsOnline        bool      `json:"is_online"`
	LastSeen        time.Time `json:"last_seen"`
	ConnectionCount int       `json:"connection_count"`
}

// TypingInfo represents typing indicator information
type TypingInfo struct {
	UserID         uuid.UUID `json:"user_id"`
	ConversationID uuid.UUID `json:"conversation_id"`
	IsTyping       bool      `json:"is_typing"`
	ExpiresAt      time.Time `json:"expires_at"`
}

// BroadcastMessage represents a message to broadcast to a room
type BroadcastMessage struct {
	ConversationID uuid.UUID   `json:"conversation_id"`
	Event          string      `json:"event"`
	Data           interface{} `json:"data"`
	ExcludeUserID  *uuid.UUID  `json:"exclude_user_id,omitempty"`
	TargetUserID   *uuid.UUID  `json:"target_user_id,omitempty"`
}

// QueuedMessage represents a queued message for offline users
type QueuedMessage struct {
	ID        string    `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Message   WSMessage `json:"message"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// ClientStats represents client connection statistics
type ClientStats struct {
	TotalConnections  int `json:"total_connections"`
	ActiveConnections int `json:"active_connections"`
	TotalRooms        int `json:"total_rooms"`
	TotalMessages     int `json:"total_messages"`
	MessagesPerSecond int `json:"messages_per_second"`
}

// RoomStats represents room statistics
type RoomStats struct {
	ConversationID   uuid.UUID `json:"conversation_id"`
	ActiveUsers      int       `json:"active_users"`
	TotalConnections int       `json:"total_connections"`
	MessageCount     int       `json:"message_count"`
	LastActivity     time.Time `json:"last_activity"`
}
