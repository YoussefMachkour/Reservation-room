// internal/repositories/chat_repository_impl.go
package repositories

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatRepository struct {
	db     *gorm.DB
	logger *slog.Logger
}

// NewChatRepository creates a new chat repository instance
func NewChatRepository(db *gorm.DB, logger *slog.Logger) *ChatRepository {
	return &ChatRepository{
		db:     db,
		logger: logger,
	}
}

var _ interfaces.ChatRepository = (*ChatRepository)(nil)

// Conversation operations

func (r *ChatRepository) CreateConversation(ctx context.Context, conversation *models.Conversation) error {
	return r.db.WithContext(ctx).Create(conversation).Error
}

func (r *ChatRepository) GetConversationByID(ctx context.Context, id uuid.UUID) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.db.WithContext(ctx).
		Preload("Participants").
		Preload("Participants.User").
		Preload("AssignedAgent").
		First(&conversation, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *ChatRepository) GetConversationsByUserID(ctx context.Context, userID uuid.UUID, req *dto.GetConversationsRequest) ([]models.Conversation, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Conversation{}).
		Joins("JOIN conversation_participants cp ON conversations.id = cp.conversation_id").
		Where("cp.user_id = ?", userID)

	// Apply filters
	if req.Status != "" {
		query = query.Where("conversations.status = ?", req.Status)
	}
	if req.Priority != "" {
		query = query.Where("conversations.priority = ?", req.Priority)
	}
	if req.IsArchived != nil {
		query = query.Where("conversations.is_archived = ?", *req.IsArchived)
	}
	if req.Tag != "" {
		query = query.Where("? = ANY(conversations.tags)", req.Tag)
	}
	if req.Search != "" {
		search := "%" + req.Search + "%"
		query = query.Where("conversations.title ILIKE ? OR EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = conversations.id AND m.content ILIKE ?)", search, search)
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := "last_message_at"
	if req.SortBy != "" {
		sortBy = req.SortBy
	}
	sortOrder := "DESC"
	if req.SortOrder == "asc" {
		sortOrder = "ASC"
	}
	query = query.Order(fmt.Sprintf("conversations.%s %s", sortBy, sortOrder))

	// Apply pagination
	limit := 20
	if req.Limit > 0 {
		limit = req.Limit
	}
	if req.Offset > 0 {
		query = query.Offset(req.Offset)
	}
	query = query.Limit(limit)

	// Execute query with preloads
	var conversations []models.Conversation
	err := query.
		Preload("Participants").
		Preload("Participants.User").
		Preload("AssignedAgent").
		Select("DISTINCT conversations.*").
		Find(&conversations).Error

	return conversations, total, err
}

func (r *ChatRepository) UpdateConversation(ctx context.Context, conversation *models.Conversation) error {
	return r.db.WithContext(ctx).Save(conversation).Error
}

func (r *ChatRepository) DeleteConversation(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Conversation{}, "id = ?", id).Error
}

func (r *ChatRepository) ArchiveConversation(ctx context.Context, id uuid.UUID, isArchived bool) error {
	return r.db.WithContext(ctx).
		Model(&models.Conversation{}).
		Where("id = ?", id).
		Update("is_archived", isArchived).Error
}

func (r *ChatRepository) GetConversationWithParticipants(ctx context.Context, id uuid.UUID) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.db.WithContext(ctx).
		Preload("Participants").
		Preload("Participants.User").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(1)
		}).
		Preload("AssignedAgent").
		First(&conversation, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

// Participant operations

func (r *ChatRepository) AddParticipant(ctx context.Context, participant *models.ConversationParticipant) error {
	return r.db.WithContext(ctx).Create(participant).Error
}

func (r *ChatRepository) RemoveParticipant(ctx context.Context, conversationID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("conversation_id = ? AND user_id = ?", conversationID, userID).
		Delete(&models.ConversationParticipant{}).Error
}

func (r *ChatRepository) GetParticipants(ctx context.Context, conversationID uuid.UUID) ([]models.ConversationParticipant, error) {
	var participants []models.ConversationParticipant
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("conversation_id = ?", conversationID).
		Find(&participants).Error
	return participants, err
}

func (r *ChatRepository) GetParticipantByUserAndConversation(ctx context.Context, userID, conversationID uuid.UUID) (*models.ConversationParticipant, error) {
	var participant models.ConversationParticipant
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ? AND conversation_id = ?", userID, conversationID).
		First(&participant).Error

	if err != nil {
		return nil, err
	}
	return &participant, nil
}

func (r *ChatRepository) UpdateParticipantUnreadCount(ctx context.Context, conversationID, userID uuid.UUID, count int) error {
	return r.db.WithContext(ctx).
		Model(&models.ConversationParticipant{}).
		Where("conversation_id = ? AND user_id = ?", conversationID, userID).
		Update("unread_count", count).Error
}

func (r *ChatRepository) IsUserParticipant(ctx context.Context, userID, conversationID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.ConversationParticipant{}).
		Where("user_id = ? AND conversation_id = ?", userID, conversationID).
		Count(&count).Error
	return count > 0, err
}

// Message operations

func (r *ChatRepository) CreateMessage(ctx context.Context, message *models.Message) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create message
		if err := tx.Create(message).Error; err != nil {
			return err
		}

		// Update conversation last_message_at (handled by trigger, but we can do it here too for consistency)
		if err := tx.Model(&models.Conversation{}).
			Where("id = ?", message.ConversationID).
			Update("last_message_at", message.CreatedAt).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *ChatRepository) GetMessageByID(ctx context.Context, id uuid.UUID) (*models.Message, error) {
	var message models.Message
	err := r.db.WithContext(ctx).
		Preload("Sender").
		Preload("Attachments").
		Preload("ReadReceipts").
		Preload("ReadReceipts.User").
		First(&message, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *ChatRepository) GetMessagesByConversationID(ctx context.Context, conversationID uuid.UUID, req *dto.GetMessagesRequest) ([]models.Message, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Message{}).
		Where("conversation_id = ?", conversationID)

	// Apply filters
	if req.MessageType != "" {
		query = query.Where("message_type = ?", req.MessageType)
	}

	// Apply cursor-based pagination
	if req.Before != nil && *req.Before != "" {
		beforeTime, err := time.Parse(time.RFC3339, *req.Before)
		if err == nil {
			query = query.Where("created_at < ?", beforeTime)
		}
	}
	if req.After != nil && *req.After != "" {
		afterTime, err := time.Parse(time.RFC3339, *req.After)
		if err == nil {
			query = query.Where("created_at > ?", afterTime)
		}
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	limit := 50
	if req.Limit > 0 {
		limit = req.Limit
	}
	if req.Offset > 0 {
		query = query.Offset(req.Offset)
	}
	query = query.Limit(limit)

	// Execute query with preloads
	var messages []models.Message
	err := query.
		Preload("Sender").
		Preload("Attachments").
		Order("created_at DESC").
		Find(&messages).Error

	return messages, total, err
}

func (r *ChatRepository) UpdateMessage(ctx context.Context, message *models.Message) error {
	return r.db.WithContext(ctx).Save(message).Error
}

func (r *ChatRepository) DeleteMessage(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Message{}, "id = ?", id).Error
}

func (r *ChatRepository) SearchMessages(ctx context.Context, userID uuid.UUID, req *dto.SearchMessagesRequest) ([]models.Message, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.Message{}).
		Joins("JOIN conversation_participants cp ON messages.conversation_id = cp.conversation_id").
		Where("cp.user_id = ?", userID)

	// Apply search query
	if req.Query != "" {
		search := "%" + req.Query + "%"
		query = query.Where("messages.content ILIKE ?", search)
	}

	// Apply filters
	if req.ConversationID != nil {
		query = query.Where("messages.conversation_id = ?", *req.ConversationID)
	}
	if req.MessageType != "" {
		query = query.Where("messages.message_type = ?", req.MessageType)
	}
	if req.SenderID != nil {
		query = query.Where("messages.sender_id = ?", *req.SenderID)
	}
	if req.StartDate != nil && *req.StartDate != "" {
		startDate, err := time.Parse("2006-01-02", *req.StartDate)
		if err == nil {
			query = query.Where("messages.created_at >= ?", startDate)
		}
	}
	if req.EndDate != nil && *req.EndDate != "" {
		endDate, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			query = query.Where("messages.created_at <= ?", endDate.Add(24*time.Hour))
		}
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	limit := 20
	if req.Limit > 0 {
		limit = req.Limit
	}
	if req.Offset > 0 {
		query = query.Offset(req.Offset)
	}
	query = query.Limit(limit)

	// Execute query with preloads
	var messages []models.Message
	err := query.
		Preload("Sender").
		Preload("Attachments").
		Preload("Conversation").
		Select("DISTINCT messages.*").
		Order("messages.created_at DESC").
		Find(&messages).Error

	return messages, total, err
}

// Message attachment operations

func (r *ChatRepository) CreateMessageAttachment(ctx context.Context, attachment *models.MessageAttachment) error {
	return r.db.WithContext(ctx).Create(attachment).Error
}

func (r *ChatRepository) GetAttachmentsByMessageID(ctx context.Context, messageID uuid.UUID) ([]models.MessageAttachment, error) {
	var attachments []models.MessageAttachment
	err := r.db.WithContext(ctx).
		Where("message_id = ?", messageID).
		Find(&attachments).Error
	return attachments, err
}

func (r *ChatRepository) DeleteAttachment(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.MessageAttachment{}, "id = ?", id).Error
}

// Read receipt operations

func (r *ChatRepository) MarkMessageAsRead(ctx context.Context, messageID, userID uuid.UUID) error {
	readReceipt := &models.MessageReadReceipt{
		MessageID: messageID,
		UserID:    userID,
	}
	return r.db.WithContext(ctx).
		Where("message_id = ? AND user_id = ?", messageID, userID).
		FirstOrCreate(readReceipt).Error
}

func (r *ChatRepository) GetReadReceipts(ctx context.Context, messageID uuid.UUID) ([]models.MessageReadReceipt, error) {
	var receipts []models.MessageReadReceipt
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("message_id = ?", messageID).
		Find(&receipts).Error
	return receipts, err
}

func (r *ChatRepository) GetUnreadCount(ctx context.Context, conversationID, userID uuid.UUID) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ?", conversationID, userID).
		Where("NOT EXISTS (SELECT 1 FROM message_read_receipts mrr WHERE mrr.message_id = messages.id AND mrr.user_id = ?)", userID).
		Count(&count).Error
	return int(count), err
}

func (r *ChatRepository) GetUnreadMessageIDs(ctx context.Context, conversationID, userID uuid.UUID) ([]uuid.UUID, error) {
	var messageIDs []uuid.UUID
	err := r.db.WithContext(ctx).
		Model(&models.Message{}).
		Select("id").
		Where("conversation_id = ? AND sender_id != ?", conversationID, userID).
		Where("NOT EXISTS (SELECT 1 FROM message_read_receipts mrr WHERE mrr.message_id = messages.id AND mrr.user_id = ?)", userID).
		Pluck("id", &messageIDs).Error
	return messageIDs, err
}

func (r *ChatRepository) MarkMultipleMessagesAsRead(ctx context.Context, messageIDs []uuid.UUID, userID uuid.UUID) error {
	if len(messageIDs) == 0 {
		return nil
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, messageID := range messageIDs {
			readReceipt := &models.MessageReadReceipt{
				MessageID: messageID,
				UserID:    userID,
			}
			if err := tx.Where("message_id = ? AND user_id = ?", messageID, userID).
				FirstOrCreate(readReceipt).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// Support agent operations

func (r *ChatRepository) CreateSupportAgent(ctx context.Context, agent *models.SupportAgent) error {
	return r.db.WithContext(ctx).Create(agent).Error
}

func (r *ChatRepository) GetSupportAgentByID(ctx context.Context, id uuid.UUID) (*models.SupportAgent, error) {
	var agent models.SupportAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		First(&agent, "id = ?", id).Error

	if err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *ChatRepository) GetSupportAgents(ctx context.Context, department string, status string, limit, offset int) ([]models.SupportAgent, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.SupportAgent{})

	if department != "" {
		query = query.Where("department = ?", department)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Count total records
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	var agents []models.SupportAgent
	err := query.
		Preload("User").
		Order("rating DESC, last_seen_at DESC").
		Find(&agents).Error

	return agents, total, err
}

func (r *ChatRepository) UpdateSupportAgent(ctx context.Context, agent *models.SupportAgent) error {
	return r.db.WithContext(ctx).Save(agent).Error
}

func (r *ChatRepository) DeleteSupportAgent(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.SupportAgent{}, "id = ?", id).Error
}

func (r *ChatRepository) GetAvailableAgents(ctx context.Context, department string) ([]models.SupportAgent, error) {
	query := r.db.WithContext(ctx).
		Where("status IN (?)", []string{"online", "away"})

	if department != "" {
		query = query.Where("department = ?", department)
	}

	var agents []models.SupportAgent
	err := query.
		Preload("User").
		Order("rating DESC, last_seen_at DESC").
		Find(&agents).Error

	return agents, err
}

func (r *ChatRepository) UpdateAgentStatus(ctx context.Context, agentID uuid.UUID, status string) error {
	updates := map[string]interface{}{
		"status":       status,
		"last_seen_at": time.Now(),
	}
	return r.db.WithContext(ctx).
		Model(&models.SupportAgent{}).
		Where("id = ?", agentID).
		Updates(updates).Error
}

// Statistics and analytics

func (r *ChatRepository) GetConversationStats(ctx context.Context, req *dto.ConversationStatsRequest) (*dto.ConversationStatsResponse, error) {
	stats := &dto.ConversationStatsResponse{}

	// Base query conditions
	conditions := []string{}
	args := []interface{}{}

	if req.StartDate != nil && *req.StartDate != "" {
		conditions = append(conditions, "created_at >= ?")
		startDate, _ := time.Parse("2006-01-02", *req.StartDate)
		args = append(args, startDate)
	}
	if req.EndDate != nil && *req.EndDate != "" {
		conditions = append(conditions, "created_at <= ?")
		endDate, _ := time.Parse("2006-01-02", *req.EndDate)
		args = append(args, endDate.Add(24*time.Hour))
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Get conversation counts by status
	query := fmt.Sprintf(`
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
			COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
		FROM conversations %s`, whereClause)

	row := r.db.WithContext(ctx).Raw(query, args...).Row()
	err := row.Scan(&stats.TotalConversations, &stats.ActiveConversations, &stats.ResolvedConversations, &stats.PendingConversations)
	if err != nil {
		return nil, err
	}

	// Get total message count
	messageQuery := fmt.Sprintf("SELECT COUNT(*) FROM messages %s", strings.Replace(whereClause, "created_at", "messages.created_at", -1))
	if err := r.db.WithContext(ctx).Raw(messageQuery, args...).Scan(&stats.TotalMessages).Error; err != nil {
		return nil, err
	}

	// Calculate average response time (simplified)
	stats.AverageResponseTime = 30.5 // TODO: Implement proper calculation

	return stats, nil
}

func (r *ChatRepository) GetUserConversationCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.ConversationParticipant{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *ChatRepository) GetAgentWorkload(ctx context.Context, agentID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Conversation{}).
		Where("assigned_agent_id = ? AND status = 'active'", agentID).
		Count(&count).Error
	return count, err
}

func (r *ChatRepository) GetDailyMessageCounts(ctx context.Context, startDate, endDate time.Time) ([]dto.DailyConversationStats, error) {
	var stats []dto.DailyConversationStats

	query := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as total_messages
		FROM messages 
		WHERE created_at >= ? AND created_at <= ?
		GROUP BY DATE(created_at)
		ORDER BY date`

	rows, err := r.db.WithContext(ctx).Raw(query, startDate, endDate).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var stat dto.DailyConversationStats
		if err := rows.Scan(&stat.Date, &stat.TotalMessages); err != nil {
			return nil, err
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// Utility operations

func (r *ChatRepository) CleanupOldMessages(ctx context.Context, retentionDays int) error {
	cutoffDate := time.Now().AddDate(0, 0, -retentionDays)
	return r.db.WithContext(ctx).
		Where("created_at < ?", cutoffDate).
		Delete(&models.Message{}).Error
}

func (r *ChatRepository) GetConversationParticipantIDs(ctx context.Context, conversationID uuid.UUID) ([]uuid.UUID, error) {
	var userIDs []uuid.UUID
	err := r.db.WithContext(ctx).
		Model(&models.ConversationParticipant{}).
		Select("user_id").
		Where("conversation_id = ?", conversationID).
		Pluck("user_id", &userIDs).Error
	return userIDs, err
}

func (r *ChatRepository) BulkUpdateUnreadCounts(ctx context.Context, conversationID uuid.UUID, excludeUserID uuid.UUID) error {
	return r.db.WithContext(ctx).Exec(`
		UPDATE conversation_participants 
		SET unread_count = unread_count + 1 
		WHERE conversation_id = ? AND user_id != ?`,
		conversationID, excludeUserID).Error
}
