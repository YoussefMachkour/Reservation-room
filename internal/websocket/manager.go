package websocket

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Manager is the main WebSocket manager that coordinates all WebSocket operations
type Manager struct {
	// Core components
	hub         *Hub
	eventRouter *EventRouter

	// WebSocket upgrader
	upgrader websocket.Upgrader

	// Configuration
	config *Config

	// Service integrations
	authHandler       AuthHandler
	permissionChecker PermissionChecker
	messageQueue      MessageQueue

	// Event handlers for business logic integration
	businessHandlers map[string]BusinessEventHandler
	handlersMutex    sync.RWMutex

	// Metrics and monitoring
	metrics *Metrics

	// Lifecycle
	ctx          context.Context
	cancel       context.CancelFunc
	running      bool
	runningMutex sync.RWMutex
}

// Config represents WebSocket manager configuration
type Config struct {
	// Connection settings
	ReadBufferSize   int           `json:"read_buffer_size"`
	WriteBufferSize  int           `json:"write_buffer_size"`
	HandshakeTimeout time.Duration `json:"handshake_timeout"`

	// Message settings
	MaxMessageSize int64 `json:"max_message_size"`
	MaxQueueSize   int   `json:"max_queue_size"`

	// Timeout settings
	WriteTimeout      time.Duration `json:"write_timeout"`
	ReadTimeout       time.Duration `json:"read_timeout"`
	HeartbeatInterval time.Duration `json:"heartbeat_interval"`
	PongTimeout       time.Duration `json:"pong_timeout"`

	// Connection limits
	MaxConnections  int `json:"max_connections"`
	MaxRoomsPerUser int `json:"max_rooms_per_user"`

	// Origins allowed for CORS
	AllowedOrigins []string `json:"allowed_origins"`

	// Security settings
	CheckOrigin       bool `json:"check_origin"`
	EnableCompression bool `json:"enable_compression"`
}

// DefaultConfig returns default WebSocket configuration
func DefaultConfig() *Config {
	return &Config{
		ReadBufferSize:    1024,
		WriteBufferSize:   1024,
		HandshakeTimeout:  10 * time.Second,
		MaxMessageSize:    MaxMessageSize,
		MaxQueueSize:      MaxQueueSize,
		WriteTimeout:      WriteTimeout,
		ReadTimeout:       ReadTimeout,
		HeartbeatInterval: HeartbeatInterval,
		PongTimeout:       PongTimeout,
		MaxConnections:    MaxConnections,
		MaxRoomsPerUser:   MaxRoomsPerUser,
		AllowedOrigins:    []string{"*"},
		CheckOrigin:       true,
		EnableCompression: true,
	}
}

// BusinessEventHandler defines the interface for handling business logic events
type BusinessEventHandler interface {
	HandleBusinessEvent(event WSEvent) error
}

// Metrics represents WebSocket metrics
type Metrics struct {
	// Connection metrics
	TotalConnections     int64   `json:"total_connections"`
	ActiveConnections    int64   `json:"active_connections"`
	ConnectionsPerSecond float64 `json:"connections_per_second"`

	// Message metrics
	TotalMessages      int64   `json:"total_messages"`
	MessagesPerSecond  float64 `json:"messages_per_second"`
	AverageMessageSize int64   `json:"average_message_size"`

	// Error metrics
	TotalErrors     int64   `json:"total_errors"`
	ErrorsPerSecond float64 `json:"errors_per_second"`

	// Performance metrics
	AverageLatency time.Duration `json:"average_latency"`
	MaxLatency     time.Duration `json:"max_latency"`

	// Resource usage
	MemoryUsage int64   `json:"memory_usage"`
	CPUUsage    float64 `json:"cpu_usage"`

	// Timestamps
	StartTime  time.Time `json:"start_time"`
	LastUpdate time.Time `json:"last_update"`

	// Detailed metrics
	EventTypeMetrics    map[string]*EventMetrics   `json:"event_type_metrics"`
	ConversationMetrics map[uuid.UUID]*RoomMetrics `json:"conversation_metrics"`

	mutex sync.RWMutex
}

// EventMetrics represents metrics for a specific event type
type EventMetrics struct {
	Count          int64         `json:"count"`
	AverageSize    int64         `json:"average_size"`
	AverageLatency time.Duration `json:"average_latency"`
	ErrorCount     int64         `json:"error_count"`
	LastOccurrence time.Time     `json:"last_occurrence"`
}

// RoomMetrics represents metrics for a specific conversation room
type RoomMetrics struct {
	ConversationID   uuid.UUID     `json:"conversation_id"`
	ActiveUsers      int           `json:"active_users"`
	TotalConnections int           `json:"total_connections"`
	MessageCount     int64         `json:"message_count"`
	LastActivity     time.Time     `json:"last_activity"`
	AverageLatency   time.Duration `json:"average_latency"`
}

// NewManager creates a new WebSocket manager
func NewManager(
	authHandler AuthHandler,
	permissionChecker PermissionChecker,
	messageQueue MessageQueue,
	config *Config,
) *Manager {
	if config == nil {
		config = DefaultConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	// Create upgrader
	upgrader := websocket.Upgrader{
		ReadBufferSize:    config.ReadBufferSize,
		WriteBufferSize:   config.WriteBufferSize,
		HandshakeTimeout:  config.HandshakeTimeout,
		EnableCompression: config.EnableCompression,
		CheckOrigin: func(r *http.Request) bool {
			if !config.CheckOrigin {
				return true
			}

			origin := r.Header.Get("Origin")
			for _, allowedOrigin := range config.AllowedOrigins {
				if allowedOrigin == "*" || allowedOrigin == origin {
					return true
				}
			}
			return false
		},
	}

	// Create hub
	hub := NewHub(authHandler, permissionChecker, messageQueue)

	// Create event router
	eventRouter := NewEventRouter()

	// Create metrics
	metrics := &Metrics{
		StartTime:           time.Now(),
		LastUpdate:          time.Now(),
		EventTypeMetrics:    make(map[string]*EventMetrics),
		ConversationMetrics: make(map[uuid.UUID]*RoomMetrics),
	}

	manager := &Manager{
		hub:               hub,
		eventRouter:       eventRouter,
		upgrader:          upgrader,
		config:            config,
		authHandler:       authHandler,
		permissionChecker: permissionChecker,
		messageQueue:      messageQueue,
		businessHandlers:  make(map[string]BusinessEventHandler),
		metrics:           metrics,
		ctx:               ctx,
		cancel:            cancel,
		running:           false,
	}

	// Register default event handlers
	manager.registerDefaultHandlers()

	return manager
}

// Start starts the WebSocket manager
func (m *Manager) Start() error {
	m.runningMutex.Lock()
	defer m.runningMutex.Unlock()

	if m.running {
		return fmt.Errorf("manager is already running")
	}

	log.Println("Starting WebSocket manager...")

	// Start the hub
	go m.hub.Run()

	// Start metrics collection
	go m.collectMetrics()

	// Start cleanup routine
	go m.cleanup()

	m.running = true
	log.Println("WebSocket manager started successfully")

	return nil
}

// Stop stops the WebSocket manager
func (m *Manager) Stop() error {
	m.runningMutex.Lock()
	defer m.runningMutex.Unlock()

	if !m.running {
		return fmt.Errorf("manager is not running")
	}

	log.Println("Stopping WebSocket manager...")

	// Cancel context to stop all goroutines
	m.cancel()

	// Stop the hub
	m.hub.Stop()

	m.running = false
	log.Println("WebSocket manager stopped successfully")

	return nil
}

// IsRunning returns whether the manager is running
func (m *Manager) IsRunning() bool {
	m.runningMutex.RLock()
	defer m.runningMutex.RUnlock()
	return m.running
}

// HandleWebSocketUpgrade handles WebSocket upgrade requests
func (m *Manager) HandleWebSocketUpgrade(w http.ResponseWriter, r *http.Request, userID uuid.UUID) error {
	// Check if manager is running
	if !m.IsRunning() {
		http.Error(w, "WebSocket service unavailable", http.StatusServiceUnavailable)
		return fmt.Errorf("manager is not running")
	}

	// Check connection limits
	if m.isConnectionLimitReached() {
		http.Error(w, "Connection limit reached", http.StatusTooManyRequests)
		return fmt.Errorf("connection limit reached")
	}

	// Upgrade the connection
	conn, err := m.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return fmt.Errorf("upgrade failed: %w", err)
	}

	// Create client
	client := NewClient(userID, conn, m.hub)

	// Register client with hub
	m.hub.RegisterClient(client)

	// Start client
	client.Run()

	// Update metrics
	m.updateConnectionMetrics(1)

	log.Printf("WebSocket connection established for user %s", userID)

	return nil
}

// Business logic integration methods

// RegisterBusinessHandler registers a business event handler
func (m *Manager) RegisterBusinessHandler(eventType string, handler BusinessEventHandler) {
	m.handlersMutex.Lock()
	defer m.handlersMutex.Unlock()

	m.businessHandlers[eventType] = handler
	log.Printf("Registered business handler for event type: %s", eventType)
}

// UnregisterBusinessHandler unregisters a business event handler
func (m *Manager) UnregisterBusinessHandler(eventType string) {
	m.handlersMutex.Lock()
	defer m.handlersMutex.Unlock()

	delete(m.businessHandlers, eventType)
	log.Printf("Unregistered business handler for event type: %s", eventType)
}

// Broadcasting methods (these integrate with your service layer TODOs)

// BroadcastMessageSent broadcasts a message sent event
func (m *Manager) BroadcastMessageSent(conversationID uuid.UUID, messageData MessageEventData, excludeUserID *uuid.UUID) {
	event := NewMessageSentEvent(messageData)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, excludeUserID)
	m.updateEventMetrics(event.Event)
}

// BroadcastMessageUpdated broadcasts a message updated event
func (m *Manager) BroadcastMessageUpdated(conversationID uuid.UUID, messageData MessageEventData, excludeUserID *uuid.UUID) {
	event := NewMessageUpdatedEvent(messageData)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, excludeUserID)
	m.updateEventMetrics(event.Event)
}

// BroadcastMessageDeleted broadcasts a message deleted event
func (m *Manager) BroadcastMessageDeleted(conversationID, messageID, userID uuid.UUID) {
	event := NewMessageDeletedEvent(conversationID, messageID, userID)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, &userID)
	m.updateEventMetrics(event.Event)
}

// BroadcastMessageRead broadcasts message read receipts
func (m *Manager) BroadcastMessageRead(conversationID uuid.UUID, readData ReadReceiptEventData, excludeUserID *uuid.UUID) {
	event := NewMessageReadEvent(readData)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, excludeUserID)
	m.updateEventMetrics(event.Event)
}

// BroadcastConversationCreated broadcasts a conversation created event
func (m *Manager) BroadcastConversationCreated(conversationData ConversationEventData) {
	event := NewConversationCreatedEvent(conversationData)
	// Broadcast to all participants
	for _, participant := range conversationData.Participants {
		m.hub.BroadcastToUser(participant.UserID, event.Event, event.Data)
	}
	m.updateEventMetrics(event.Event)
}

// BroadcastConversationUpdated broadcasts a conversation updated event
func (m *Manager) BroadcastConversationUpdated(conversationID uuid.UUID, conversationData ConversationEventData, excludeUserID *uuid.UUID) {
	event := NewConversationUpdatedEvent(conversationData)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, excludeUserID)
	m.updateEventMetrics(event.Event)
}

// BroadcastConversationArchived broadcasts a conversation archived event
func (m *Manager) BroadcastConversationArchived(conversationID uuid.UUID, archivedBy uuid.UUID) {
	event := NewConversationArchivedEvent(conversationID, archivedBy)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, &archivedBy)
	m.updateEventMetrics(event.Event)
}

// BroadcastUserTyping broadcasts typing indicator updates
func (m *Manager) BroadcastUserTyping(conversationID, userID uuid.UUID, isTyping bool) {
	event := NewUserTypingEvent(userID, conversationID, isTyping)
	m.hub.BroadcastToConversation(conversationID, event.Event, event.Data, &userID)
	m.updateEventMetrics(event.Event)
}

// Query methods

// GetOnlineUsers returns online users in a conversation
func (m *Manager) GetOnlineUsers(conversationID uuid.UUID) []uuid.UUID {
	return m.hub.GetOnlineUsers(conversationID)
}

// GetUserPresence returns user presence information
func (m *Manager) GetUserPresence(userID uuid.UUID) *PresenceInfo {
	return m.hub.GetUserPresence(userID)
}

// GetTypingUsers returns users currently typing in a conversation
func (m *Manager) GetTypingUsers(conversationID uuid.UUID) []uuid.UUID {
	return m.hub.GetTypingUsers(conversationID)
}

// GetConnectionStats returns connection statistics
func (m *Manager) GetConnectionStats() ClientStats {
	return m.hub.GetStats()
}

// GetMetrics returns detailed metrics
func (m *Manager) GetMetrics() *Metrics {
	m.metrics.mutex.RLock()
	defer m.metrics.mutex.RUnlock()

	// Create a copy to avoid race conditions
	metricsCopy := &Metrics{
		TotalConnections:     m.metrics.TotalConnections,
		ActiveConnections:    m.metrics.ActiveConnections,
		ConnectionsPerSecond: m.metrics.ConnectionsPerSecond,
		TotalMessages:        m.metrics.TotalMessages,
		MessagesPerSecond:    m.metrics.MessagesPerSecond,
		AverageMessageSize:   m.metrics.AverageMessageSize,
		TotalErrors:          m.metrics.TotalErrors,
		ErrorsPerSecond:      m.metrics.ErrorsPerSecond,
		AverageLatency:       m.metrics.AverageLatency,
		MaxLatency:           m.metrics.MaxLatency,
		MemoryUsage:          m.metrics.MemoryUsage,
		CPUUsage:             m.metrics.CPUUsage,
		StartTime:            m.metrics.StartTime,
		LastUpdate:           m.metrics.LastUpdate,
		EventTypeMetrics:     make(map[string]*EventMetrics),
		ConversationMetrics:  make(map[uuid.UUID]*RoomMetrics),
	}

	// Copy nested maps
	for k, v := range m.metrics.EventTypeMetrics {
		metricsCopy.EventTypeMetrics[k] = &EventMetrics{
			Count:          v.Count,
			AverageSize:    v.AverageSize,
			AverageLatency: v.AverageLatency,
			ErrorCount:     v.ErrorCount,
			LastOccurrence: v.LastOccurrence,
		}
	}

	for k, v := range m.metrics.ConversationMetrics {
		metricsCopy.ConversationMetrics[k] = &RoomMetrics{
			ConversationID:   v.ConversationID,
			ActiveUsers:      v.ActiveUsers,
			TotalConnections: v.TotalConnections,
			MessageCount:     v.MessageCount,
			LastActivity:     v.LastActivity,
			AverageLatency:   v.AverageLatency,
		}
	}

	return metricsCopy
}

// Internal methods

// registerDefaultHandlers registers default event handlers
func (m *Manager) registerDefaultHandlers() {
	// Register handlers for system events
	m.eventRouter.RegisterHandler(WSEventHeartbeat, &HeartbeatHandler{})
	m.eventRouter.RegisterHandler(WSEventError, &ErrorHandler{})
	m.eventRouter.RegisterHandler(WSEventAck, &AckHandler{})

	log.Println("Registered default WebSocket event handlers")
}

// isConnectionLimitReached checks if connection limit is reached
func (m *Manager) isConnectionLimitReached() bool {
	stats := m.hub.GetStats()
	return stats.ActiveConnections >= m.config.MaxConnections
}

// updateConnectionMetrics updates connection-related metrics
func (m *Manager) updateConnectionMetrics(delta int64) {
	m.metrics.mutex.Lock()
	defer m.metrics.mutex.Unlock()

	if delta > 0 {
		m.metrics.TotalConnections += delta
		m.metrics.ActiveConnections += delta
	} else {
		m.metrics.ActiveConnections += delta
		if m.metrics.ActiveConnections < 0 {
			m.metrics.ActiveConnections = 0
		}
	}

	m.metrics.LastUpdate = time.Now()
}

// updateEventMetrics updates event-related metrics
func (m *Manager) updateEventMetrics(eventType string) {
	m.metrics.mutex.Lock()
	defer m.metrics.mutex.Unlock()

	m.metrics.TotalMessages++

	if m.metrics.EventTypeMetrics[eventType] == nil {
		m.metrics.EventTypeMetrics[eventType] = &EventMetrics{}
	}

	eventMetrics := m.metrics.EventTypeMetrics[eventType]
	eventMetrics.Count++
	eventMetrics.LastOccurrence = time.Now()

	m.metrics.LastUpdate = time.Now()
}

// collectMetrics runs periodic metrics collection
func (m *Manager) collectMetrics() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.updatePerformanceMetrics()
		}
	}
}

// updatePerformanceMetrics updates performance-related metrics
func (m *Manager) updatePerformanceMetrics() {
	m.metrics.mutex.Lock()
	defer m.metrics.mutex.Unlock()

	now := time.Now()
	duration := now.Sub(m.metrics.LastUpdate).Seconds()

	if duration > 0 {
		m.metrics.MessagesPerSecond = float64(m.metrics.TotalMessages) / now.Sub(m.metrics.StartTime).Seconds()
		m.metrics.ConnectionsPerSecond = float64(m.metrics.TotalConnections) / now.Sub(m.metrics.StartTime).Seconds()
	}

	m.metrics.LastUpdate = now
}

// cleanup runs periodic cleanup tasks
func (m *Manager) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.performCleanup()
		}
	}
}

// performCleanup performs cleanup tasks
func (m *Manager) performCleanup() {
	// Clean up old metrics data
	m.cleanupOldMetrics()

	// Log current status
	stats := m.GetConnectionStats()
	log.Printf("WebSocket Manager Status - Active Connections: %d, Total Messages: %d, Total Rooms: %d",
		stats.ActiveConnections, stats.TotalMessages, stats.TotalRooms)
}

// cleanupOldMetrics removes old metrics data
func (m *Manager) cleanupOldMetrics() {
	m.metrics.mutex.Lock()
	defer m.metrics.mutex.Unlock()

	cutoff := time.Now().Add(-24 * time.Hour)

	for eventType, metrics := range m.metrics.EventTypeMetrics {
		if metrics.LastOccurrence.Before(cutoff) {
			delete(m.metrics.EventTypeMetrics, eventType)
		}
	}

	for conversationID, metrics := range m.metrics.ConversationMetrics {
		if metrics.LastActivity.Before(cutoff) {
			delete(m.metrics.ConversationMetrics, conversationID)
		}
	}
}

// Default event handlers

// HeartbeatHandler handles heartbeat events
type HeartbeatHandler struct{}

func (h *HeartbeatHandler) HandleEvent(client *Client, event WSEvent) error {
	// Heartbeat handling is already implemented in client.go
	return nil
}

// ErrorHandler handles error events
type ErrorHandler struct{}

func (h *ErrorHandler) HandleEvent(client *Client, event WSEvent) error {
	log.Printf("WebSocket error from client %s: %+v", client.GetID(), event.Data)
	return nil
}

// AckHandler handles acknowledgment events
type AckHandler struct{}

func (h *AckHandler) HandleEvent(client *Client, event WSEvent) error {
	// Acknowledgment handling is already implemented in client.go
	return nil
}
