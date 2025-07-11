// internal/services/chat_service.go
package interfaces

import (
	"context"
	"mime/multipart"

	"room-reservation-api/internal/dto"

	"github.com/google/uuid"
)

// ChatService defines the interface for chat business logic
type ChatService interface {
	// Conversation operations
	CreateConversation(ctx context.Context, userID uuid.UUID, req *dto.CreateConversationRequest) (*dto.ConversationResponse, error)
	GetConversations(ctx context.Context, userID uuid.UUID, req *dto.GetConversationsRequest) (*dto.ConversationListResponse, error)
	GetConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (*dto.ConversationResponse, error)
	UpdateConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.UpdateConversationRequest) (*dto.ConversationResponse, error)
	ArchiveConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error
	DeleteConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error

	// Message operations
	SendMessage(ctx context.Context, userID uuid.UUID, req *dto.SendMessageRequest) (*dto.MessageResponse, error)
	GetMessages(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.GetMessagesRequest) (*dto.MessageListResponse, error)
	UpdateMessage(ctx context.Context, userID uuid.UUID, messageID uuid.UUID, req *dto.UpdateMessageRequest) (*dto.MessageResponse, error)
	DeleteMessage(ctx context.Context, userID uuid.UUID, messageID uuid.UUID) error
	SearchMessages(ctx context.Context, userID uuid.UUID, req *dto.SearchMessagesRequest) (*dto.MessageSearchResponse, error)

	// Participant operations
	AddParticipant(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.AddParticipantRequest) error
	RemoveParticipant(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.RemoveParticipantRequest) error
	LeaveConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error

	// Read receipt operations
	MarkMessagesAsRead(ctx context.Context, userID uuid.UUID, req *dto.MarkMessagesReadRequest) error
	GetReadReceipts(ctx context.Context, userID uuid.UUID, messageID uuid.UUID) ([]dto.ReadReceiptResponse, error)

	// File operations
	UploadFile(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*dto.FileUploadResponse, error)
	DeleteAttachment(ctx context.Context, userID uuid.UUID, attachmentID uuid.UUID) error

	// Support agent operations
	CreateSupportAgent(ctx context.Context, adminUserID uuid.UUID, req *dto.CreateSupportAgentRequest) (*dto.SupportAgentResponse, error)
	GetSupportAgents(ctx context.Context, department string, status string, limit, offset int) (*dto.SupportAgentListResponse, error)
	UpdateSupportAgent(ctx context.Context, agentID uuid.UUID, req *dto.UpdateSupportAgentRequest) (*dto.SupportAgentResponse, error)
	AssignAgent(ctx context.Context, adminUserID uuid.UUID, conversationID uuid.UUID, req *dto.AssignAgentRequest) error
	UpdateAgentStatus(ctx context.Context, agentID uuid.UUID, status string) error
	GetAvailableAgents(ctx context.Context, department string) ([]dto.SupportAgentResponse, error)

	// Real-time operations
	SetTypingStatus(ctx context.Context, userID uuid.UUID, req *dto.SetTypingStatusRequest) error
	GetOnlineUsers(ctx context.Context, conversationID uuid.UUID) (*dto.OnlineUsersResponse, error)

	// Analytics and statistics
	GetConversationStats(ctx context.Context, userID uuid.UUID, req *dto.ConversationStatsRequest) (*dto.ConversationStatsResponse, error)
	GetConversationSummary(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (*dto.ConversationSummaryResponse, error)

	// System operations
	CreateSystemMessage(ctx context.Context, conversationID uuid.UUID, messageType string, content string, metadata map[string]interface{}) error
	NotifyReservationUpdate(ctx context.Context, userID uuid.UUID, reservationID uuid.UUID, messageType string) error
	CleanupOldMessages(ctx context.Context, retentionDays int) error

	// Permission helpers
	CanUserAccessConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (bool, error)
	CanUserModifyMessage(ctx context.Context, userID uuid.UUID, messageID uuid.UUID) (bool, error)
	IsUserAgent(ctx context.Context, userID uuid.UUID) (bool, error)
}
