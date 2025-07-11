package websocket

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Hub maintains the set of active clients and broadcasts messages to clients
type Hub struct {
	// Registered clients by user ID
	clients      map[uuid.UUID]map[string]*Client // userID -> connectionID -> client
	clientsMutex sync.RWMutex

	// Room subscriptions - conversation_id -> user_id -> connection_id -> client
	rooms      map[uuid.UUID]map[uuid.UUID]map[string]*Client
	roomsMutex sync.RWMutex

	// User presence tracking
	presence      map[uuid.UUID]*PresenceInfo
	presenceMutex sync.RWMutex

	// Typing indicators by conversation
	typing      map[uuid.UUID]map[uuid.UUID]*TypingInfo // conversation_id -> user_id -> typing_info
	typingMutex sync.RWMutex

	// Channels for hub operations
	register   chan *Client
	unregister chan *Client
	broadcast  chan BroadcastMessage

	// Message queue for offline users
	messageQueue MessageQueue

	// Authentication handler
	authHandler AuthHandler

	// Permission checker
	permissionChecker PermissionChecker

	// Context for cancellation
	ctx    context.Context
	cancel context.CancelFunc

	// Statistics
	stats struct {
		totalConnections  int64
		activeConnections int64
		totalMessages     int64
		messagesPerSecond int64
		startTime         time.Time
		lastStatsUpdate   time.Time
	}
	statsMutex sync.RWMutex
}

// AuthHandler interface for handling authentication
type AuthHandler interface {
	AuthenticateToken(token string) (*uuid.UUID, error)
}

// PermissionChecker interface for checking permissions
type PermissionChecker interface {
	CanJoinConversation(userID, conversationID uuid.UUID) bool
	CanSendMessage(userID, conversationID uuid.UUID) bool
}

// MessageQueue interface for handling offline messages
type MessageQueue interface {
	QueueMessage(userID uuid.UUID, message WSMessage) error
	GetQueuedMessages(userID uuid.UUID) ([]QueuedMessage, error)
	ClearQueuedMessages(userID uuid.UUID) error
}

// NewHub creates a new WebSocket hub
func NewHub(authHandler AuthHandler, permissionChecker PermissionChecker, messageQueue MessageQueue) *Hub {
	ctx, cancel := context.WithCancel(context.Background())

	return &Hub{
		clients:           make(map[uuid.UUID]map[string]*Client),
		rooms:             make(map[uuid.UUID]map[uuid.UUID]map[string]*Client),
		presence:          make(map[uuid.UUID]*PresenceInfo),
		typing:            make(map[uuid.UUID]map[uuid.UUID]*TypingInfo),
		register:          make(chan *Client),
		unregister:        make(chan *Client),
		broadcast:         make(chan BroadcastMessage),
		messageQueue:      messageQueue,
		authHandler:       authHandler,
		permissionChecker: permissionChecker,
		ctx:               ctx,
		cancel:            cancel,
	}
}

// Run starts the hub's main event loop
func (h *Hub) Run() {
	// Initialize stats
	h.statsMutex.Lock()
	h.stats.startTime = time.Now()
	h.stats.lastStatsUpdate = time.Now()
	h.statsMutex.Unlock()

	// Start cleanup ticker
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-h.ctx.Done():
			return

		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastMessage(message)

		case <-ticker.C:
			h.cleanup()
			h.updateStats()
		}
	}
}

// Stop stops the hub
func (h *Hub) Stop() {
	h.cancel()

	// Close all client connections
	h.clientsMutex.Lock()
	for _, userClients := range h.clients {
		for _, client := range userClients {
			client.Close()
		}
	}
	h.clientsMutex.Unlock()
}

// RegisterClient registers a new client
func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

// UnregisterClient unregisters a client
func (h *Hub) UnregisterClient(client *Client) {
	h.unregister <- client
}

// BroadcastToConversation broadcasts a message to all clients in a conversation
func (h *Hub) BroadcastToConversation(conversationID uuid.UUID, event string, data interface{}, excludeUserID *uuid.UUID) {
	message := BroadcastMessage{
		ConversationID: conversationID,
		Event:          event,
		Data:           data,
		ExcludeUserID:  excludeUserID,
	}

	select {
	case h.broadcast <- message:
	case <-h.ctx.Done():
	}
}

// BroadcastToUser broadcasts a message to all connections of a specific user
func (h *Hub) BroadcastToUser(userID uuid.UUID, event string, data interface{}) {
	message := BroadcastMessage{
		ConversationID: uuid.UUID{}, // Will be ignored
		Event:          event,
		Data:           data,
		TargetUserID:   &userID,
	}

	select {
	case h.broadcast <- message:
	case <-h.ctx.Done():
	}
}

// GetOnlineUsers returns online users in a conversation
func (h *Hub) GetOnlineUsers(conversationID uuid.UUID) []uuid.UUID {
	h.roomsMutex.RLock()
	defer h.roomsMutex.RUnlock()

	room, exists := h.rooms[conversationID]
	if !exists {
		return []uuid.UUID{}
	}

	users := make([]uuid.UUID, 0, len(room))
	for userID := range room {
		users = append(users, userID)
	}

	return users
}

// GetUserPresence returns user presence information
func (h *Hub) GetUserPresence(userID uuid.UUID) *PresenceInfo {
	h.presenceMutex.RLock()
	defer h.presenceMutex.RUnlock()

	if presence, exists := h.presence[userID]; exists {
		return presence
	}

	return &PresenceInfo{
		UserID:          userID,
		IsOnline:        false,
		LastSeen:        time.Time{},
		ConnectionCount: 0,
	}
}

// GetTypingUsers returns users currently typing in a conversation
func (h *Hub) GetTypingUsers(conversationID uuid.UUID) []uuid.UUID {
	h.typingMutex.RLock()
	defer h.typingMutex.RUnlock()

	conversationTyping, exists := h.typing[conversationID]
	if !exists {
		return []uuid.UUID{}
	}

	now := time.Now()
	users := make([]uuid.UUID, 0)

	for userID, typingInfo := range conversationTyping {
		if typingInfo.IsTyping && now.Before(typingInfo.ExpiresAt) {
			users = append(users, userID)
		}
	}

	return users
}

// GetStats returns hub statistics
func (h *Hub) GetStats() ClientStats {
	h.statsMutex.RLock()
	defer h.statsMutex.RUnlock()

	h.clientsMutex.RLock()
	activeConnections := 0
	for _, userClients := range h.clients {
		activeConnections += len(userClients)
	}
	h.clientsMutex.RUnlock()

	h.roomsMutex.RLock()
	totalRooms := len(h.rooms)
	h.roomsMutex.RUnlock()

	return ClientStats{
		TotalConnections:  int(h.stats.totalConnections),
		ActiveConnections: activeConnections,
		TotalRooms:        totalRooms,
		TotalMessages:     int(h.stats.totalMessages),
		MessagesPerSecond: int(h.stats.messagesPerSecond),
	}
}

// Internal methods

// registerClient handles client registration
func (h *Hub) registerClient(client *Client) {
	userID := client.GetUserID()
	connectionID := client.GetID()

	log.Printf("Registering client %s for user %s", connectionID, userID)

	h.clientsMutex.Lock()
	if h.clients[userID] == nil {
		h.clients[userID] = make(map[string]*Client)
	}
	h.clients[userID][connectionID] = client
	h.clientsMutex.Unlock()

	// Update presence
	h.updateUserPresence(userID, true)

	// Update stats
	h.statsMutex.Lock()
	h.stats.totalConnections++
	h.stats.activeConnections++
	h.statsMutex.Unlock()

	// Send queued messages if any
	h.sendQueuedMessages(userID)

	log.Printf("Client %s registered successfully", connectionID)
}

// unregisterClient handles client unregistration
func (h *Hub) unregisterClient(client *Client) {
	userID := client.GetUserID()
	connectionID := client.GetID()

	log.Printf("Unregistering client %s for user %s", connectionID, userID)

	// Remove from all rooms
	rooms := client.GetRooms()
	for _, roomID := range rooms {
		h.removeClientFromRoom(client, roomID)
	}

	// Remove from clients map
	h.clientsMutex.Lock()
	if userClients, exists := h.clients[userID]; exists {
		delete(userClients, connectionID)
		if len(userClients) == 0 {
			delete(h.clients, userID)
		}
	}
	h.clientsMutex.Unlock()

	// Update presence
	h.updateUserPresence(userID, false)

	// Update stats
	h.statsMutex.Lock()
	h.stats.activeConnections--
	h.statsMutex.Unlock()

	// Close client
	client.Close()

	log.Printf("Client %s unregistered successfully", connectionID)
}

// broadcastMessage handles message broadcasting
func (h *Hub) broadcastMessage(message BroadcastMessage) {
	wsMessage := WSMessage{
		ID:             generateMessageID(),
		Type:           MessageTypeEvent,
		Event:          message.Event,
		ConversationID: &message.ConversationID,
		Data:           message.Data,
		Timestamp:      time.Now(),
	}

	// Update stats
	h.statsMutex.Lock()
	h.stats.totalMessages++
	h.statsMutex.Unlock()

	if message.TargetUserID != nil {
		// Broadcast to specific user
		h.sendToUser(*message.TargetUserID, wsMessage)
	} else {
		// Broadcast to conversation room
		h.sendToConversation(message.ConversationID, wsMessage, message.ExcludeUserID)
	}
}

// sendToConversation sends a message to all clients in a conversation
func (h *Hub) sendToConversation(conversationID uuid.UUID, message WSMessage, excludeUserID *uuid.UUID) {
	h.roomsMutex.RLock()
	room, exists := h.rooms[conversationID]
	if !exists {
		h.roomsMutex.RUnlock()
		return
	}

	// Create a copy of the room to avoid holding the lock during sending
	recipients := make(map[uuid.UUID]map[string]*Client)
	for userID, userConnections := range room {
		if excludeUserID != nil && userID == *excludeUserID {
			continue
		}
		recipients[userID] = make(map[string]*Client)
		for connID, client := range userConnections {
			recipients[userID][connID] = client
		}
	}
	h.roomsMutex.RUnlock()

	// Send to all recipients
	for userID, userConnections := range recipients {
		for _, client := range userConnections {
			if err := client.SendMessage(message); err != nil {
				log.Printf("Failed to send message to client %s (user %s): %v", client.GetID(), userID, err)
			}
		}

		// Queue message for offline connections
		if len(userConnections) == 0 {
			if h.messageQueue != nil {
				h.messageQueue.QueueMessage(userID, message)
			}
		}
	}
}

// sendToUser sends a message to all connections of a specific user
func (h *Hub) sendToUser(userID uuid.UUID, message WSMessage) {
	h.clientsMutex.RLock()
	userClients, exists := h.clients[userID]
	if !exists {
		h.clientsMutex.RUnlock()
		// Queue message for offline user
		if h.messageQueue != nil {
			h.messageQueue.QueueMessage(userID, message)
		}
		return
	}

	// Create a copy to avoid holding the lock during sending
	clients := make([]*Client, 0, len(userClients))
	for _, client := range userClients {
		clients = append(clients, client)
	}
	h.clientsMutex.RUnlock()

	// Send to all user connections
	for _, client := range clients {
		if err := client.SendMessage(message); err != nil {
			log.Printf("Failed to send message to client %s (user %s): %v", client.GetID(), userID, err)
		}
	}
}

// sendQueuedMessages sends queued messages to a user
func (h *Hub) sendQueuedMessages(userID uuid.UUID) {
	if h.messageQueue == nil {
		return
	}

	queuedMessages, err := h.messageQueue.GetQueuedMessages(userID)
	if err != nil {
		log.Printf("Failed to get queued messages for user %s: %v", userID, err)
		return
	}

	if len(queuedMessages) == 0 {
		return
	}

	log.Printf("Sending %d queued messages to user %s", len(queuedMessages), userID)

	for _, queuedMsg := range queuedMessages {
		h.sendToUser(userID, queuedMsg.Message)
	}

	// Clear queued messages
	if err := h.messageQueue.ClearQueuedMessages(userID); err != nil {
		log.Printf("Failed to clear queued messages for user %s: %v", userID, err)
	}
}

// updateUserPresence updates user presence information
func (h *Hub) updateUserPresence(userID uuid.UUID, isOnline bool) {
	h.presenceMutex.Lock()
	defer h.presenceMutex.Unlock()

	presence, exists := h.presence[userID]
	if !exists {
		presence = &PresenceInfo{
			UserID:          userID,
			IsOnline:        false,
			ConnectionCount: 0,
		}
		h.presence[userID] = presence
	}

	if isOnline {
		presence.ConnectionCount++
		presence.IsOnline = true
	} else {
		presence.ConnectionCount--
		if presence.ConnectionCount <= 0 {
			presence.ConnectionCount = 0
			presence.IsOnline = false
			presence.LastSeen = time.Now()
		}
	}

	// Broadcast presence update
	h.broadcastPresenceUpdate(userID, presence)
}

// broadcastPresenceUpdate broadcasts user presence changes
func (h *Hub) broadcastPresenceUpdate(userID uuid.UUID, presence *PresenceInfo) {
	// Find all conversations the user is part of and broadcast to those rooms
	h.roomsMutex.RLock()
	affectedRooms := make([]uuid.UUID, 0)
	for roomID, room := range h.rooms {
		if _, userInRoom := room[userID]; userInRoom {
			affectedRooms = append(affectedRooms, roomID)
		}
	}
	h.roomsMutex.RUnlock()

	// Broadcast to affected rooms
	for _, roomID := range affectedRooms {
		h.BroadcastToConversation(roomID, WSEventUserOnline, presence, &userID)
	}
}

// addClientToRoom adds a client to a conversation room
func (h *Hub) addClientToRoom(client *Client, conversationID uuid.UUID) {
	userID := client.GetUserID()
	connectionID := client.GetID()

	h.roomsMutex.Lock()
	if h.rooms[conversationID] == nil {
		h.rooms[conversationID] = make(map[uuid.UUID]map[string]*Client)
	}
	if h.rooms[conversationID][userID] == nil {
		h.rooms[conversationID][userID] = make(map[string]*Client)
	}
	h.rooms[conversationID][userID][connectionID] = client
	h.roomsMutex.Unlock()

	client.JoinRoom(conversationID)

	// Broadcast user joined event
	h.BroadcastToConversation(conversationID, WSEventUserJoined, map[string]interface{}{
		"user_id": userID,
	}, &userID)
}

// removeClientFromRoom removes a client from a conversation room
func (h *Hub) removeClientFromRoom(client *Client, conversationID uuid.UUID) {
	userID := client.GetUserID()
	connectionID := client.GetID()

	h.roomsMutex.Lock()
	if room, exists := h.rooms[conversationID]; exists {
		if userConnections, userExists := room[userID]; userExists {
			delete(userConnections, connectionID)
			if len(userConnections) == 0 {
				delete(room, userID)
				if len(room) == 0 {
					delete(h.rooms, conversationID)
				}
			}
		}
	}
	h.roomsMutex.Unlock()

	client.LeaveRoom(conversationID)

	// Check if user has any other connections in the room
	h.roomsMutex.RLock()
	hasOtherConnections := false
	if room, exists := h.rooms[conversationID]; exists {
		if _, userExists := room[userID]; userExists {
			hasOtherConnections = true
		}
	}
	h.roomsMutex.RUnlock()

	// Broadcast user left event only if no other connections
	if !hasOtherConnections {
		h.BroadcastToConversation(conversationID, WSEventUserLeft, map[string]interface{}{
			"user_id": userID,
		}, &userID)
	}
}

// cleanup performs periodic cleanup tasks
func (h *Hub) cleanup() {
	// Clean up expired typing indicators
	h.cleanupTypingIndicators()

	// Clean up empty rooms
	h.cleanupEmptyRooms()

	// Clean up stale presence information
	h.cleanupStalePresence()
}

// cleanupTypingIndicators removes expired typing indicators
func (h *Hub) cleanupTypingIndicators() {
	h.typingMutex.Lock()
	defer h.typingMutex.Unlock()

	now := time.Now()
	for conversationID, conversationTyping := range h.typing {
		for userID, typingInfo := range conversationTyping {
			if now.After(typingInfo.ExpiresAt) {
				delete(conversationTyping, userID)

				// Broadcast typing stopped
				h.BroadcastToConversation(conversationID, WSEventUserTyping, map[string]interface{}{
					"user_id":   userID,
					"is_typing": false,
				}, &userID)
			}
		}

		if len(conversationTyping) == 0 {
			delete(h.typing, conversationID)
		}
	}
}

// cleanupEmptyRooms removes empty rooms
func (h *Hub) cleanupEmptyRooms() {
	h.roomsMutex.Lock()
	defer h.roomsMutex.Unlock()

	for conversationID, room := range h.rooms {
		if len(room) == 0 {
			delete(h.rooms, conversationID)
		}
	}
}

// cleanupStalePresence removes stale presence information
func (h *Hub) cleanupStalePresence() {
	h.presenceMutex.Lock()
	defer h.presenceMutex.Unlock()

	for userID, presence := range h.presence {
		if !presence.IsOnline && time.Since(presence.LastSeen) > 24*time.Hour {
			delete(h.presence, userID)
		}
	}
}

// updateStats updates hub statistics
func (h *Hub) updateStats() {
	h.statsMutex.Lock()
	defer h.statsMutex.Unlock()

	now := time.Now()
	timeSinceLastUpdate := now.Sub(h.stats.lastStatsUpdate).Seconds()

	if timeSinceLastUpdate > 0 {
		h.stats.messagesPerSecond = int64(float64(h.stats.totalMessages) / timeSinceLastUpdate)
	}

	h.stats.lastStatsUpdate = now
}

// Event handlers called by clients

// handleAuth handles client authentication
func (h *Hub) handleAuth(client *Client, message WSMessage) {
	var authMsg WSAuthMessage
	if err := mapToStruct(message.Data, &authMsg); err != nil {
		client.sendError("Invalid auth message", 400)
		return
	}

	userID, err := h.authHandler.AuthenticateToken(authMsg.Token)
	if err != nil {
		client.sendError("Authentication failed", 401)
		return
	}

	if *userID != client.GetUserID() {
		client.sendError("Token user mismatch", 403)
		return
	}

	client.SetAuthenticated(true)
	client.sendAck(message.ID, true)

	log.Printf("Client %s authenticated for user %s", client.GetID(), userID)
}

// handleJoin handles room join requests
func (h *Hub) handleJoin(client *Client, conversationID uuid.UUID) {
	userID := client.GetUserID()

	// Check permissions
	if !h.permissionChecker.CanJoinConversation(userID, conversationID) {
		client.sendError("Permission denied", 403)
		return
	}

	// Add to room
	h.addClientToRoom(client, conversationID)

	log.Printf("Client %s joined room %s", client.GetID(), conversationID)
}

// handleLeave handles room leave requests
func (h *Hub) handleLeave(client *Client, conversationID uuid.UUID) {
	h.removeClientFromRoom(client, conversationID)
	log.Printf("Client %s left room %s", client.GetID(), conversationID)
}

// handleTyping handles typing indicator updates
func (h *Hub) handleTyping(client *Client, conversationID uuid.UUID, isTyping bool) {
	userID := client.GetUserID()

	// Check if client is in the room
	if !client.IsInRoom(conversationID) {
		client.sendError("Not in conversation", 403)
		return
	}

	// Update typing state
	client.SetTyping(conversationID, isTyping)

	// Update global typing state
	h.typingMutex.Lock()
	if h.typing[conversationID] == nil {
		h.typing[conversationID] = make(map[uuid.UUID]*TypingInfo)
	}

	if isTyping {
		h.typing[conversationID][userID] = &TypingInfo{
			UserID:         userID,
			ConversationID: conversationID,
			IsTyping:       true,
			ExpiresAt:      time.Now().Add(TypingTimeout),
		}
	} else {
		delete(h.typing[conversationID], userID)
	}
	h.typingMutex.Unlock()

	// Broadcast typing status
	h.BroadcastToConversation(conversationID, WSEventUserTyping, map[string]interface{}{
		"user_id":   userID,
		"is_typing": isTyping,
	}, &userID)
}

// handleChatMessage handles chat messages (forwards to service layer)
func (h *Hub) handleChatMessage(client *Client, message WSMessage) {
	// This will be implemented when integrating with the service layer
	// For now, just acknowledge the message
	client.sendAck(message.ID, true)
}
