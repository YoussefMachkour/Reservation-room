package interfaces

import (
	"context"
	"time"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"

	"github.com/google/uuid"
)

// ChatRepository defines the interface for chat-related database operations
type ChatRepository interface {
	// Conversation operations
	CreateConversation(ctx context.Context, conversation *models.Conversation) error
	GetConversationByID(ctx context.Context, id uuid.UUID) (*models.Conversation, error)
	GetConversationsByUserID(ctx context.Context, userID uuid.UUID, req *dto.GetConversationsRequest) ([]models.Conversation, int64, error)
	UpdateConversation(ctx context.Context, conversation *models.Conversation) error
	DeleteConversation(ctx context.Context, id uuid.UUID) error
	ArchiveConversation(ctx context.Context, id uuid.UUID, isArchived bool) error
	GetConversationWithParticipants(ctx context.Context, id uuid.UUID) (*models.Conversation, error)

	// Participant operations
	AddParticipant(ctx context.Context, participant *models.ConversationParticipant) error
	RemoveParticipant(ctx context.Context, conversationID, userID uuid.UUID) error
	GetParticipants(ctx context.Context, conversationID uuid.UUID) ([]models.ConversationParticipant, error)
	GetParticipantByUserAndConversation(ctx context.Context, userID, conversationID uuid.UUID) (*models.ConversationParticipant, error)
	UpdateParticipantUnreadCount(ctx context.Context, conversationID, userID uuid.UUID, count int) error
	IsUserParticipant(ctx context.Context, userID, conversationID uuid.UUID) (bool, error)

	// Message operations
	CreateMessage(ctx context.Context, message *models.Message) error
	GetMessageByID(ctx context.Context, id uuid.UUID) (*models.Message, error)
	GetMessagesByConversationID(ctx context.Context, conversationID uuid.UUID, req *dto.GetMessagesRequest) ([]models.Message, int64, error)
	UpdateMessage(ctx context.Context, message *models.Message) error
	DeleteMessage(ctx context.Context, id uuid.UUID) error
	SearchMessages(ctx context.Context, userID uuid.UUID, req *dto.SearchMessagesRequest) ([]models.Message, int64, error)

	// Message attachment operations
	CreateMessageAttachment(ctx context.Context, attachment *models.MessageAttachment) error
	GetAttachmentsByMessageID(ctx context.Context, messageID uuid.UUID) ([]models.MessageAttachment, error)
	DeleteAttachment(ctx context.Context, id uuid.UUID) error

	// Read receipt operations
	MarkMessageAsRead(ctx context.Context, messageID, userID uuid.UUID) error
	GetReadReceipts(ctx context.Context, messageID uuid.UUID) ([]models.MessageReadReceipt, error)
	GetUnreadCount(ctx context.Context, conversationID, userID uuid.UUID) (int, error)
	GetUnreadMessageIDs(ctx context.Context, conversationID, userID uuid.UUID) ([]uuid.UUID, error)
	MarkMultipleMessagesAsRead(ctx context.Context, messageIDs []uuid.UUID, userID uuid.UUID) error

	// Support agent operations
	CreateSupportAgent(ctx context.Context, agent *models.SupportAgent) error
	GetSupportAgentByID(ctx context.Context, id uuid.UUID) (*models.SupportAgent, error)
	GetSupportAgents(ctx context.Context, department string, status string, limit, offset int) ([]models.SupportAgent, int64, error)
	UpdateSupportAgent(ctx context.Context, agent *models.SupportAgent) error
	DeleteSupportAgent(ctx context.Context, id uuid.UUID) error
	GetAvailableAgents(ctx context.Context, department string) ([]models.SupportAgent, error)
	UpdateAgentStatus(ctx context.Context, agentID uuid.UUID, status string) error

	// Statistics and analytics
	GetConversationStats(ctx context.Context, req *dto.ConversationStatsRequest) (*dto.ConversationStatsResponse, error)
	GetUserConversationCount(ctx context.Context, userID uuid.UUID) (int64, error)
	GetAgentWorkload(ctx context.Context, agentID uuid.UUID) (int64, error)
	GetDailyMessageCounts(ctx context.Context, startDate, endDate time.Time) ([]dto.DailyConversationStats, error)

	// Utility operations
	CleanupOldMessages(ctx context.Context, retentionDays int) error
	GetConversationParticipantIDs(ctx context.Context, conversationID uuid.UUID) ([]uuid.UUID, error)
	BulkUpdateUnreadCounts(ctx context.Context, conversationID uuid.UUID, excludeUserID uuid.UUID) error
}
