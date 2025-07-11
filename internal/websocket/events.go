package websocket

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// EventHandler defines the interface for handling WebSocket events
type EventHandler interface {
	HandleEvent(client *Client, event WSEvent) error
}

// WSEvent represents a structured WebSocket event
type WSEvent struct {
	ID             string                 `json:"id"`
	Type           string                 `json:"type"`
	Event          string                 `json:"event"`
	ConversationID *uuid.UUID             `json:"conversation_id,omitempty"`
	UserID         *uuid.UUID             `json:"user_id,omitempty"`
	Data           interface{}            `json:"data"`
	Timestamp      time.Time              `json:"timestamp"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// Event payload structures for different event types

// MessageEventData represents message-related event data
type MessageEventData struct {
	MessageID      uuid.UUID              `json:"message_id"`
	ConversationID uuid.UUID              `json:"conversation_id"`
	UserID         uuid.UUID              `json:"user_id"`
	Content        string                 `json:"content,omitempty"`
	MessageType    string                 `json:"message_type,omitempty"`
	Attachments    []AttachmentData       `json:"attachments,omitempty"`
	ReplyToID      *uuid.UUID             `json:"reply_to_id,omitempty"`
	EditedAt       *time.Time             `json:"edited_at,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
}

// ConversationEventData represents conversation-related event data
type ConversationEventData struct {
	ConversationID uuid.UUID              `json:"conversation_id"`
	Title          string                 `json:"title,omitempty"`
	Status         string                 `json:"status,omitempty"`
	Priority       string                 `json:"priority,omitempty"`
	Tags           []string               `json:"tags,omitempty"`
	Participants   []ParticipantData      `json:"participants,omitempty"`
	LastMessageAt  *time.Time             `json:"last_message_at,omitempty"`
	UnreadCount    int                    `json:"unread_count,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

// ParticipantData represents participant information
type ParticipantData struct {
	UserID   uuid.UUID  `json:"user_id"`
	Role     string     `json:"role"`
	JoinedAt time.Time  `json:"joined_at"`
	IsOnline bool       `json:"is_online"`
	LastSeen *time.Time `json:"last_seen,omitempty"`
}

// AttachmentData represents file attachment information
type AttachmentData struct {
	ID           uuid.UUID `json:"id"`
	FileName     string    `json:"file_name"`
	FileSize     int64     `json:"file_size"`
	FileType     string    `json:"file_type"`
	FileURL      string    `json:"file_url,omitempty"`
	ThumbnailURL string    `json:"thumbnail_url,omitempty"`
	UploadedAt   time.Time `json:"uploaded_at"`
}

// UserEventData represents user-related event data
type UserEventData struct {
	UserID          uuid.UUID              `json:"user_id"`
	ConversationID  *uuid.UUID             `json:"conversation_id,omitempty"`
	IsOnline        bool                   `json:"is_online"`
	IsTyping        bool                   `json:"is_typing,omitempty"`
	LastSeen        *time.Time             `json:"last_seen,omitempty"`
	ConnectionCount int                    `json:"connection_count,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

// ReadReceiptEventData represents read receipt event data
type ReadReceiptEventData struct {
	ConversationID uuid.UUID   `json:"conversation_id"`
	UserID         uuid.UUID   `json:"user_id"`
	MessageIDs     []uuid.UUID `json:"message_ids"`
	ReadAt         time.Time   `json:"read_at"`
}

// SystemEventData represents system-level event data
type SystemEventData struct {
	EventType   string                 `json:"event_type"`
	Message     string                 `json:"message"`
	Severity    string                 `json:"severity"` // info, warning, error
	AffectedIDs []uuid.UUID            `json:"affected_ids,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// ErrorEventData represents error event data
type ErrorEventData struct {
	Code      int                    `json:"code"`
	Message   string                 `json:"message"`
	Details   string                 `json:"details,omitempty"`
	RequestID string                 `json:"request_id,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// EventRouter handles routing events to appropriate handlers
type EventRouter struct {
	handlers map[string]EventHandler
}

// NewEventRouter creates a new event router
func NewEventRouter() *EventRouter {
	return &EventRouter{
		handlers: make(map[string]EventHandler),
	}
}

// RegisterHandler registers an event handler for a specific event type
func (er *EventRouter) RegisterHandler(eventType string, handler EventHandler) {
	er.handlers[eventType] = handler
}

// RouteEvent routes an event to the appropriate handler
func (er *EventRouter) RouteEvent(client *Client, event WSEvent) error {
	handler, exists := er.handlers[event.Event]
	if !exists {
		return fmt.Errorf("no handler found for event type: %s", event.Event)
	}

	return handler.HandleEvent(client, event)
}

// Event builder functions

// NewMessageSentEvent creates a message sent event
func NewMessageSentEvent(messageData MessageEventData) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventMessageSent,
		ConversationID: &messageData.ConversationID,
		UserID:         &messageData.UserID,
		Data:           messageData,
		Timestamp:      time.Now(),
	}
}

// NewMessageUpdatedEvent creates a message updated event
func NewMessageUpdatedEvent(messageData MessageEventData) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventMessageUpdated,
		ConversationID: &messageData.ConversationID,
		UserID:         &messageData.UserID,
		Data:           messageData,
		Timestamp:      time.Now(),
	}
}

// NewMessageDeletedEvent creates a message deleted event
func NewMessageDeletedEvent(conversationID, messageID, userID uuid.UUID) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventMessageDeleted,
		ConversationID: &conversationID,
		UserID:         &userID,
		Data: map[string]interface{}{
			"message_id":      messageID,
			"conversation_id": conversationID,
			"deleted_by":      userID,
			"deleted_at":      time.Now(),
		},
		Timestamp: time.Now(),
	}
}

// NewMessageReadEvent creates a message read event
func NewMessageReadEvent(readData ReadReceiptEventData) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventMessageRead,
		ConversationID: &readData.ConversationID,
		UserID:         &readData.UserID,
		Data:           readData,
		Timestamp:      time.Now(),
	}
}

// NewConversationCreatedEvent creates a conversation created event
func NewConversationCreatedEvent(conversationData ConversationEventData) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventConversationCreated,
		ConversationID: &conversationData.ConversationID,
		Data:           conversationData,
		Timestamp:      time.Now(),
	}
}

// NewConversationUpdatedEvent creates a conversation updated event
func NewConversationUpdatedEvent(conversationData ConversationEventData) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventConversationUpdated,
		ConversationID: &conversationData.ConversationID,
		Data:           conversationData,
		Timestamp:      time.Now(),
	}
}

// NewConversationArchivedEvent creates a conversation archived event
func NewConversationArchivedEvent(conversationID uuid.UUID, archivedBy uuid.UUID) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventConversationArchived,
		ConversationID: &conversationID,
		UserID:         &archivedBy,
		Data: map[string]interface{}{
			"conversation_id": conversationID,
			"archived_by":     archivedBy,
			"archived_at":     time.Now(),
		},
		Timestamp: time.Now(),
	}
}

// NewUserTypingEvent creates a user typing event
func NewUserTypingEvent(userID, conversationID uuid.UUID, isTyping bool) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventUserTyping,
		ConversationID: &conversationID,
		UserID:         &userID,
		Data: UserEventData{
			UserID:         userID,
			ConversationID: &conversationID,
			IsTyping:       isTyping,
		},
		Timestamp: time.Now(),
	}
}

// NewUserOnlineEvent creates a user online event
func NewUserOnlineEvent(userID uuid.UUID, isOnline bool, connectionCount int) WSEvent {
	event := WSEventUserOnline
	if !isOnline {
		event = WSEventUserOffline
	}

	return WSEvent{
		ID:     generateEventID(),
		Type:   MessageTypeEvent,
		Event:  event,
		UserID: &userID,
		Data: UserEventData{
			UserID:          userID,
			IsOnline:        isOnline,
			ConnectionCount: connectionCount,
			LastSeen:        timePtr(time.Now()),
		},
		Timestamp: time.Now(),
	}
}

// NewUserJoinedEvent creates a user joined conversation event
func NewUserJoinedEvent(userID, conversationID uuid.UUID) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventUserJoined,
		ConversationID: &conversationID,
		UserID:         &userID,
		Data: UserEventData{
			UserID:         userID,
			ConversationID: &conversationID,
			IsOnline:       true,
		},
		Timestamp: time.Now(),
	}
}

// NewUserLeftEvent creates a user left conversation event
func NewUserLeftEvent(userID, conversationID uuid.UUID) WSEvent {
	return WSEvent{
		ID:             generateEventID(),
		Type:           MessageTypeEvent,
		Event:          WSEventUserLeft,
		ConversationID: &conversationID,
		UserID:         &userID,
		Data: UserEventData{
			UserID:         userID,
			ConversationID: &conversationID,
		},
		Timestamp: time.Now(),
	}
}

// NewErrorEvent creates an error event
func NewErrorEvent(code int, message, details string) WSEvent {
	return WSEvent{
		ID:    generateEventID(),
		Type:  MessageTypeError,
		Event: WSEventError,
		Data: ErrorEventData{
			Code:      code,
			Message:   message,
			Details:   details,
			Timestamp: time.Now(),
		},
		Timestamp: time.Now(),
	}
}

// NewSystemEvent creates a system event
func NewSystemEvent(eventType, message, severity string, affectedIDs []uuid.UUID) WSEvent {
	return WSEvent{
		ID:    generateEventID(),
		Type:  MessageTypeEvent,
		Event: eventType,
		Data: SystemEventData{
			EventType:   eventType,
			Message:     message,
			Severity:    severity,
			AffectedIDs: affectedIDs,
		},
		Timestamp: time.Now(),
	}
}

// Event validation and serialization

// ValidateEvent validates an event structure
func ValidateEvent(event WSEvent) error {
	if event.ID == "" {
		return fmt.Errorf("event ID is required")
	}

	if event.Type == "" {
		return fmt.Errorf("event type is required")
	}

	if event.Event == "" {
		return fmt.Errorf("event name is required")
	}

	if event.Timestamp.IsZero() {
		return fmt.Errorf("event timestamp is required")
	}

	// Validate event-specific requirements
	switch event.Event {
	case WSEventMessageSent, WSEventMessageUpdated, WSEventMessageDeleted, WSEventMessageRead:
		if event.ConversationID == nil {
			return fmt.Errorf("conversation_id is required for message events")
		}

	case WSEventConversationCreated, WSEventConversationUpdated, WSEventConversationArchived:
		if event.ConversationID == nil {
			return fmt.Errorf("conversation_id is required for conversation events")
		}

	case WSEventUserTyping, WSEventUserJoined, WSEventUserLeft:
		if event.ConversationID == nil {
			return fmt.Errorf("conversation_id is required for user conversation events")
		}
		if event.UserID == nil {
			return fmt.Errorf("user_id is required for user events")
		}

	case WSEventUserOnline, WSEventUserOffline:
		if event.UserID == nil {
			return fmt.Errorf("user_id is required for user presence events")
		}
	}

	return nil
}

// SerializeEvent serializes an event to JSON
func SerializeEvent(event WSEvent) ([]byte, error) {
	if err := ValidateEvent(event); err != nil {
		return nil, fmt.Errorf("invalid event: %w", err)
	}

	return json.Marshal(event)
}

// DeserializeEvent deserializes JSON to an event
func DeserializeEvent(data []byte) (WSEvent, error) {
	var event WSEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return WSEvent{}, fmt.Errorf("failed to deserialize event: %w", err)
	}

	if err := ValidateEvent(event); err != nil {
		return WSEvent{}, fmt.Errorf("invalid deserialized event: %w", err)
	}

	return event, nil
}

// Event transformation utilities

// WSMessageToEvent converts a WSMessage to a WSEvent
func WSMessageToEvent(message WSMessage) WSEvent {
	return WSEvent{
		ID:             message.ID,
		Type:           message.Type,
		Event:          message.Event,
		ConversationID: message.ConversationID,
		UserID:         message.UserID,
		Data:           message.Data,
		Timestamp:      message.Timestamp,
	}
}

// EventToWSMessage converts a WSEvent to a WSMessage
func EventToWSMessage(event WSEvent) WSMessage {
	return WSMessage{
		ID:             event.ID,
		Type:           event.Type,
		Event:          event.Event,
		ConversationID: event.ConversationID,
		Data:           event.Data,
		Timestamp:      event.Timestamp,
		UserID:         event.UserID,
	}
}

// Event filtering and matching

// EventMatcher defines criteria for matching events
type EventMatcher struct {
	EventTypes      []string               `json:"event_types,omitempty"`
	ConversationIDs []uuid.UUID            `json:"conversation_ids,omitempty"`
	UserIDs         []uuid.UUID            `json:"user_ids,omitempty"`
	TimeRange       *TimeRange             `json:"time_range,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

// TimeRange represents a time range for filtering
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// MatchesEvent checks if an event matches the criteria
func (em EventMatcher) MatchesEvent(event WSEvent) bool {
	// Check event types
	if len(em.EventTypes) > 0 {
		found := false
		for _, eventType := range em.EventTypes {
			if event.Event == eventType {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	// Check conversation IDs
	if len(em.ConversationIDs) > 0 && event.ConversationID != nil {
		found := false
		for _, conversationID := range em.ConversationIDs {
			if *event.ConversationID == conversationID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	// Check user IDs
	if len(em.UserIDs) > 0 && event.UserID != nil {
		found := false
		for _, userID := range em.UserIDs {
			if *event.UserID == userID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	// Check time range
	if em.TimeRange != nil {
		if event.Timestamp.Before(em.TimeRange.Start) || event.Timestamp.After(em.TimeRange.End) {
			return false
		}
	}

	// Check metadata (if implemented in the future)
	// This would require metadata matching logic

	return true
}

// Event aggregation and statistics

// EventStats represents event statistics
type EventStats struct {
	TotalEvents      int64                    `json:"total_events"`
	EventsByType     map[string]int64         `json:"events_by_type"`
	EventsByHour     map[string]int64         `json:"events_by_hour"`
	TopConversations []ConversationEventCount `json:"top_conversations"`
	TopUsers         []UserEventCount         `json:"top_users"`
	AverageEventSize int64                    `json:"average_event_size"`
	LastUpdated      time.Time                `json:"last_updated"`
}

// ConversationEventCount represents event count per conversation
type ConversationEventCount struct {
	ConversationID uuid.UUID `json:"conversation_id"`
	EventCount     int64     `json:"event_count"`
}

// UserEventCount represents event count per user
type UserEventCount struct {
	UserID     uuid.UUID `json:"user_id"`
	EventCount int64     `json:"event_count"`
}

// Utility functions

// generateEventID generates a unique event ID
func generateEventID() string {
	return fmt.Sprintf("evt_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])
}

// timePtr returns a pointer to a time.Time
func timePtr(t time.Time) *time.Time {
	return &t
}

// Event constants for easier reference
var (
	// Message events
	MessageEvents = []string{
		WSEventMessageSent,
		WSEventMessageUpdated,
		WSEventMessageDeleted,
		WSEventMessageRead,
	}

	// Conversation events
	ConversationEvents = []string{
		WSEventConversationCreated,
		WSEventConversationUpdated,
		WSEventConversationArchived,
	}

	// User events
	UserEvents = []string{
		WSEventUserTyping,
		WSEventUserOnline,
		WSEventUserOffline,
		WSEventUserJoined,
		WSEventUserLeft,
	}

	// System events
	SystemEvents = []string{
		WSEventError,
		WSEventHeartbeat,
		WSEventAck,
	}

	// All events
	AllEvents = append(append(append(MessageEvents, ConversationEvents...), UserEvents...), SystemEvents...)
)
