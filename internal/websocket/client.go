package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Client represents a WebSocket client connection
type Client struct {
	// Connection details
	id     string
	userID uuid.UUID
	conn   *websocket.Conn
	hub    *Hub

	// Communication channels
	send chan WSMessage

	// Connection state
	isAuthenticated bool
	connectedAt     time.Time
	lastActivity    time.Time
	state           string

	// Subscribed rooms (conversation IDs)
	rooms      map[uuid.UUID]bool
	roomsMutex sync.RWMutex

	// Typing indicators
	typing      map[uuid.UUID]time.Time // conversation_id -> expires_at
	typingMutex sync.RWMutex

	// Metadata
	metadata      map[string]interface{}
	metadataMutex sync.RWMutex

	// Context for cancellation
	ctx    context.Context
	cancel context.CancelFunc

	// Statistics
	messagesSent     int64
	messagesReceived int64
	bytesReceived    int64
	bytesSent        int64
}

// NewClient creates a new WebSocket client
func NewClient(userID uuid.UUID, conn *websocket.Conn, hub *Hub) *Client {
	ctx, cancel := context.WithCancel(context.Background())

	return &Client{
		id:              generateConnectionID(),
		userID:          userID,
		conn:            conn,
		hub:             hub,
		send:            make(chan WSMessage, MaxQueueSize),
		isAuthenticated: false,
		connectedAt:     time.Now(),
		lastActivity:    time.Now(),
		state:           ConnectionStateConnecting,
		rooms:           make(map[uuid.UUID]bool),
		typing:          make(map[uuid.UUID]time.Time),
		metadata:        make(map[string]interface{}),
		ctx:             ctx,
		cancel:          cancel,
	}
}

// GetID returns the client connection ID
func (c *Client) GetID() string {
	return c.id
}

// GetUserID returns the user ID
func (c *Client) GetUserID() uuid.UUID {
	return c.userID
}

// GetConnectionInfo returns connection information
func (c *Client) GetConnectionInfo() ConnectionInfo {
	c.roomsMutex.RLock()
	rooms := make(map[uuid.UUID]bool)
	for roomID, joined := range c.rooms {
		rooms[roomID] = joined
	}
	c.roomsMutex.RUnlock()

	c.metadataMutex.RLock()
	metadata := make(map[string]interface{})
	for key, value := range c.metadata {
		metadata[key] = value
	}
	c.metadataMutex.RUnlock()

	return ConnectionInfo{
		UserID:       c.userID,
		ConnectionID: c.id,
		ConnectedAt:  c.connectedAt,
		LastActivity: c.lastActivity,
		State:        c.state,
		Rooms:        rooms,
		Metadata:     metadata,
	}
}

// IsAuthenticated returns authentication status
func (c *Client) IsAuthenticated() bool {
	return c.isAuthenticated
}

// SetAuthenticated sets authentication status
func (c *Client) SetAuthenticated(authenticated bool) {
	c.isAuthenticated = authenticated
	if authenticated {
		c.state = ConnectionStateConnected
	}
}

// IsInRoom checks if client is in a specific room
func (c *Client) IsInRoom(conversationID uuid.UUID) bool {
	c.roomsMutex.RLock()
	defer c.roomsMutex.RUnlock()
	return c.rooms[conversationID]
}

// JoinRoom adds client to a conversation room
func (c *Client) JoinRoom(conversationID uuid.UUID) {
	c.roomsMutex.Lock()
	c.rooms[conversationID] = true
	c.roomsMutex.Unlock()

	log.Printf("Client %s (user %s) joined room %s", c.id, c.userID, conversationID)
}

// LeaveRoom removes client from a conversation room
func (c *Client) LeaveRoom(conversationID uuid.UUID) {
	c.roomsMutex.Lock()
	delete(c.rooms, conversationID)
	c.roomsMutex.Unlock()

	log.Printf("Client %s (user %s) left room %s", c.id, c.userID, conversationID)
}

// GetRooms returns all rooms client is in
func (c *Client) GetRooms() []uuid.UUID {
	c.roomsMutex.RLock()
	defer c.roomsMutex.RUnlock()

	rooms := make([]uuid.UUID, 0, len(c.rooms))
	for roomID := range c.rooms {
		rooms = append(rooms, roomID)
	}
	return rooms
}

// SetTyping sets typing indicator for a conversation
func (c *Client) SetTyping(conversationID uuid.UUID, isTyping bool) {
	c.typingMutex.Lock()
	defer c.typingMutex.Unlock()

	if isTyping {
		c.typing[conversationID] = time.Now().Add(TypingTimeout)
		c.state = ConnectionStateTyping
	} else {
		delete(c.typing, conversationID)
		c.state = ConnectionStateConnected
	}
}

// IsTyping checks if client is typing in a conversation
func (c *Client) IsTyping(conversationID uuid.UUID) bool {
	c.typingMutex.RLock()
	defer c.typingMutex.RUnlock()

	expiresAt, exists := c.typing[conversationID]
	if !exists {
		return false
	}

	return time.Now().Before(expiresAt)
}

// CleanupExpiredTyping removes expired typing indicators
func (c *Client) CleanupExpiredTyping() {
	c.typingMutex.Lock()
	defer c.typingMutex.Unlock()

	now := time.Now()
	hasActive := false

	for conversationID, expiresAt := range c.typing {
		if now.After(expiresAt) {
			delete(c.typing, conversationID)
		} else {
			hasActive = true
		}
	}

	if !hasActive && c.state == ConnectionStateTyping {
		c.state = ConnectionStateConnected
	}
}

// SetMetadata sets metadata for the client
func (c *Client) SetMetadata(key string, value interface{}) {
	c.metadataMutex.Lock()
	defer c.metadataMutex.Unlock()
	c.metadata[key] = value
}

// GetMetadata gets metadata value
func (c *Client) GetMetadata(key string) (interface{}, bool) {
	c.metadataMutex.RLock()
	defer c.metadataMutex.RUnlock()
	value, exists := c.metadata[key]
	return value, exists
}

// SendMessage sends a message to the client
func (c *Client) SendMessage(message WSMessage) error {
	select {
	case c.send <- message:
		return nil
	case <-c.ctx.Done():
		return fmt.Errorf("client connection closed")
	default:
		return fmt.Errorf("client send buffer full")
	}
}

// Run starts the client's read and write pumps
func (c *Client) Run() {
	go c.writePump()
	go c.readPump()
	go c.heartbeatPump()
}

// Close closes the client connection
func (c *Client) Close() {
	c.cancel()
	close(c.send)
	c.conn.Close()
	c.state = ConnectionStateDisconnected

	log.Printf("Client %s (user %s) disconnected", c.id, c.userID)
}

// readPump pumps messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(ReadTimeout))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(ReadTimeout))
		c.lastActivity = time.Now()
		return nil
	})

	for {
		select {
		case <-c.ctx.Done():
			return
		default:
			_, messageBytes, err := c.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("WebSocket error for client %s: %v", c.id, err)
				}
				return
			}

			c.lastActivity = time.Now()
			c.messagesReceived++
			c.bytesReceived += int64(len(messageBytes))

			var message WSMessage
			if err := json.Unmarshal(messageBytes, &message); err != nil {
				log.Printf("Failed to unmarshal message from client %s: %v", c.id, err)
				c.sendError("Invalid message format", http.StatusBadRequest)
				continue
			}

			// Set user ID and timestamp
			message.UserID = &c.userID
			message.Timestamp = time.Now()

			// Handle message
			c.handleMessage(message)
		}
	}
}

// writePump pumps messages to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(HeartbeatInterval)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case <-c.ctx.Done():
			return
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(WriteTimeout))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			messageBytes, err := json.Marshal(message)
			if err != nil {
				log.Printf("Failed to marshal message for client %s: %v", c.id, err)
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, messageBytes); err != nil {
				log.Printf("Failed to write message to client %s: %v", c.id, err)
				return
			}

			c.messagesSent++
			c.bytesSent += int64(len(messageBytes))

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(WriteTimeout))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// heartbeatPump manages client heartbeat and cleanup
func (c *Client) heartbeatPump() {
	ticker := time.NewTicker(HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
			// Clean up expired typing indicators
			c.CleanupExpiredTyping()

			// Check for inactive connection
			if time.Since(c.lastActivity) > PongTimeout {
				log.Printf("Client %s (user %s) timeout", c.id, c.userID)
				c.Close()
				return
			}
		}
	}
}

// handleMessage handles incoming messages from the client
func (c *Client) handleMessage(message WSMessage) {
	if !c.isAuthenticated && message.Type != MessageTypeAuth {
		c.sendError("Authentication required", http.StatusUnauthorized)
		return
	}

	switch message.Type {
	case MessageTypeAuth:
		c.handleAuth(message)
	case MessageTypeJoin:
		c.handleJoin(message)
	case MessageTypeLeave:
		c.handleLeave(message)
	case MessageTypeTyping:
		c.handleTyping(message)
	case MessageTypeHeartbeat:
		c.handleHeartbeat(message)
	case MessageTypeChat:
		c.handleChat(message)
	default:
		c.sendError("Unknown message type", http.StatusBadRequest)
	}
}

// handleAuth handles authentication messages
func (c *Client) handleAuth(message WSMessage) {
	// Authentication will be handled by the hub
	c.hub.handleAuth(c, message)
}

// handleJoin handles room join messages
func (c *Client) handleJoin(message WSMessage) {
	var joinMsg WSJoinMessage
	if err := mapToStruct(message.Data, &joinMsg); err != nil {
		c.sendError("Invalid join message", http.StatusBadRequest)
		return
	}

	c.hub.handleJoin(c, joinMsg.ConversationID)
}

// handleLeave handles room leave messages
func (c *Client) handleLeave(message WSMessage) {
	var leaveMsg WSLeaveMessage
	if err := mapToStruct(message.Data, &leaveMsg); err != nil {
		c.sendError("Invalid leave message", http.StatusBadRequest)
		return
	}

	c.hub.handleLeave(c, leaveMsg.ConversationID)
}

// handleTyping handles typing indicator messages
func (c *Client) handleTyping(message WSMessage) {
	var typingMsg WSTypingMessage
	if err := mapToStruct(message.Data, &typingMsg); err != nil {
		c.sendError("Invalid typing message", http.StatusBadRequest)
		return
	}

	c.hub.handleTyping(c, typingMsg.ConversationID, typingMsg.IsTyping)
}

// handleHeartbeat handles heartbeat messages
func (c *Client) handleHeartbeat(message WSMessage) {
	c.lastActivity = time.Now()

	// Send heartbeat response
	response := WSMessage{
		ID:        generateMessageID(),
		Type:      MessageTypeHeartbeat,
		Timestamp: time.Now(),
		Data: WSHeartbeatMessage{
			Timestamp: time.Now(),
		},
	}

	c.SendMessage(response)
}

// handleChat handles chat messages
func (c *Client) handleChat(message WSMessage) {
	// Chat messages are handled by the hub and forwarded to the service layer
	c.hub.handleChatMessage(c, message)
}

// sendError sends an error message to the client
func (c *Client) sendError(message string, code int) {
	errorMsg := WSMessage{
		ID:        generateMessageID(),
		Type:      MessageTypeError,
		Timestamp: time.Now(),
		Error: &WSError{
			Code:    code,
			Message: message,
		},
	}

	c.SendMessage(errorMsg)
}

// sendAck sends an acknowledgment message to the client
func (c *Client) sendAck(originalID string, success bool) {
	ackMsg := WSMessage{
		ID:        generateMessageID(),
		Type:      MessageTypeAck,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"original_id": originalID,
			"success":     success,
		},
	}

	c.SendMessage(ackMsg)
}

// Utility functions

// generateConnectionID generates a unique connection ID
func generateConnectionID() string {
	return fmt.Sprintf("conn_%d_%s", time.Now().UnixNano(), uuid.New().String()[:8])
}

// generateMessageID generates a unique message ID
func generateMessageID() string {
	return uuid.New().String()
}

// mapToStruct converts interface{} to a struct
func mapToStruct(data interface{}, result interface{}) error {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(jsonBytes, result)
}
