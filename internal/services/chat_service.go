// internal/services/chat_service_impl.go
package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/models"
	"room-reservation-api/internal/repositories/interfaces"
	"room-reservation-api/internal/websocket"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatService struct {
	chatRepo  interfaces.ChatRepository
	userRepo  interfaces.UserRepositoryInterface
	logger    *slog.Logger
	wsManager *websocket.Manager // We'll add this later
	// fileService FileService      // For file upload handling
}

// NewChatService creates a new chat service instance
func NewChatService(
	chatRepo interfaces.ChatRepository,
	userRepo interfaces.UserRepositoryInterface,
	logger *slog.Logger,
	wsManager *websocket.Manager, // Add this parameter
) *ChatService {
	return &ChatService{
		chatRepo:  chatRepo,
		userRepo:  userRepo,
		logger:    logger,
		wsManager: wsManager, // Set the field
	}
}

// Conversation operations

func (s *ChatService) CreateConversation(ctx context.Context, userID uuid.UUID, req *dto.CreateConversationRequest) (*dto.ConversationResponse, error) {
	// Validate participants exist
	for _, participantID := range req.ParticipantIDs {
		if _, err := s.userRepo.GetByID(participantID); err != nil {
			return nil, fmt.Errorf("participant %s not found", participantID)
		}
	}

	// Create conversation
	conversation := &models.Conversation{
		Title:    req.Subject,
		Priority: models.ConversationPriority(req.Priority),
		Status:   models.ConversationStatusActive,
		Tags:     req.Tags,
	}

	if err := s.chatRepo.CreateConversation(ctx, conversation); err != nil {
		s.logger.Error("Failed to create conversation", "error", err)
		return nil, fmt.Errorf("failed to create conversation: %w", err)
	}

	// Add participants
	participantIDs := append(req.ParticipantIDs, userID) // Include creator
	for _, participantID := range participantIDs {
		userType := models.ParticipantTypeMember
		if participantID == userID {
			userType = models.ParticipantTypeAdmin // Creator is admin
		}

		participant := &models.ConversationParticipant{
			ConversationID: conversation.ID,
			UserID:         participantID,
			UserType:       userType,
		}

		if err := s.chatRepo.AddParticipant(ctx, participant); err != nil {
			s.logger.Error("Failed to add participant", "participantID", participantID, "error", err)
			return nil, fmt.Errorf("failed to add participant: %w", err)
		}
	}

	// Send initial message if provided
	if req.InitialMessage != nil {
		req.InitialMessage.ConversationID = conversation.ID
		if _, err := s.SendMessage(ctx, userID, req.InitialMessage); err != nil {
			s.logger.Warn("Failed to send initial message", "error", err)
		}
	}

	// Get the complete conversation with participants
	createdConversation, err := s.chatRepo.GetConversationWithParticipants(ctx, conversation.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get created conversation: %w", err)
	}

	response := s.mapConversationToResponse(createdConversation, userID)

	// Broadcast conversation creation via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		conversationData := websocket.ConversationEventData{
			ConversationID: createdConversation.ID,
			Title:          *createdConversation.Title,
			Status:         string(createdConversation.Status),
			Priority:       string(createdConversation.Priority),
			Tags:           createdConversation.Tags,
			UpdatedAt:      createdConversation.CreatedAt,
		}

		// Add participants data
		participants := make([]websocket.ParticipantData, len(createdConversation.Participants))
		for i, p := range createdConversation.Participants {
			isOnline := false
			if s.wsManager != nil {
				presence := s.wsManager.GetUserPresence(p.UserID)
				isOnline = presence.IsOnline
			}

			participants[i] = websocket.ParticipantData{
				UserID:   p.UserID,
				Role:     string(p.UserType),
				JoinedAt: p.JoinedAt,
				IsOnline: isOnline,
			}
		}
		conversationData.Participants = participants

		// Add unread count and last message info
		if !createdConversation.LastMessageAt.IsZero() {
			conversationData.LastMessageAt = &createdConversation.LastMessageAt
		}
		conversationData.UnreadCount = 0 // New conversation starts with no unread messages

		s.wsManager.BroadcastConversationCreated(conversationData)

		s.logger.Info("Broadcasted conversation creation",
			"conversationID", createdConversation.ID,
			"participantCount", len(participants))
	}

	return response, nil
}

func (s *ChatService) GetConversations(ctx context.Context, userID uuid.UUID, req *dto.GetConversationsRequest) (*dto.ConversationListResponse, error) {
	conversations, total, err := s.chatRepo.GetConversationsByUserID(ctx, userID, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversations: %w", err)
	}

	// Calculate total unread count for user
	var totalUnread int64
	for _, conv := range conversations {
		for _, participant := range conv.Participants {
			if participant.UserID == userID {
				totalUnread += int64(participant.UnreadCount)
				break
			}
		}
	}

	response := &dto.ConversationListResponse{
		Conversations: make([]dto.ConversationResponse, len(conversations)),
		TotalCount:    total,
		UnreadCount:   totalUnread,
		HasMore:       int64(req.Offset+req.Limit) < total,
	}

	if response.HasMore {
		nextOffset := req.Offset + req.Limit
		response.NextOffset = &nextOffset
	}

	for i, conv := range conversations {
		response.Conversations[i] = *s.mapConversationToResponse(&conv, userID)
	}

	return response, nil
}

func (s *ChatService) GetConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (*dto.ConversationResponse, error) {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	conversation, err := s.chatRepo.GetConversationByID(ctx, conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("conversation not found")
		}
		return nil, fmt.Errorf("failed to get conversation: %w", err)
	}

	return s.mapConversationToResponse(conversation, userID), nil
}

func (s *ChatService) UpdateConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.UpdateConversationRequest) (*dto.ConversationResponse, error) {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	conversation, err := s.chatRepo.GetConversationByID(ctx, conversationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("conversation not found")
		}
		return nil, fmt.Errorf("failed to get conversation: %w", err)
	}

	// Store original values for change detection
	originalStatus := conversation.Status
	originalPriority := conversation.Priority
	originalTitle := conversation.Title
	originalTags := conversation.Tags
	originalAssignedAgentID := conversation.AssignedAgentID
	originalArchived := conversation.IsArchived

	// Track what changed for logging
	changes := make(map[string]interface{})

	// Update fields
	if req.Status != nil && string(conversation.Status) != *req.Status {
		conversation.Status = models.ConversationStatus(*req.Status)
		changes["status"] = map[string]string{"from": string(originalStatus), "to": *req.Status}
	}
	if req.Priority != nil && string(conversation.Priority) != *req.Priority {
		conversation.Priority = models.ConversationPriority(*req.Priority)
		changes["priority"] = map[string]string{"from": string(originalPriority), "to": *req.Priority}
	}
	if req.AssignedAgentID != nil {
		conversation.AssignedAgentID = req.AssignedAgentID
		changes["assignedAgent"] = map[string]interface{}{
			"from": originalAssignedAgentID,
			"to":   req.AssignedAgentID,
		}
	}
	if req.Tags != nil {
		conversation.Tags = *req.Tags
		changes["tags"] = map[string]interface{}{
			"from": originalTags,
			"to":   *req.Tags,
		}
	}
	if req.IsArchived != nil && conversation.IsArchived != *req.IsArchived {
		conversation.IsArchived = *req.IsArchived
		changes["archived"] = map[string]bool{"from": originalArchived, "to": *req.IsArchived}
	}
	if req.Title != nil && (conversation.Title == nil || *conversation.Title != *req.Title) {
		conversation.Title = req.Title
		changes["title"] = map[string]interface{}{
			"from": originalTitle,
			"to":   req.Title,
		}
	}

	// Only update if there are actual changes
	if len(changes) == 0 {
		s.logger.Debug("No changes detected for conversation update", "conversationID", conversationID)
		return s.mapConversationToResponse(conversation, userID), nil
	}

	if err := s.chatRepo.UpdateConversation(ctx, conversation); err != nil {
		return nil, fmt.Errorf("failed to update conversation: %w", err)
	}

	// Broadcast conversation update via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		conversationData := websocket.ConversationEventData{
			ConversationID: conversation.ID,
			Title: func() string {
				if conversation.Title != nil {
					return *conversation.Title
				}
				return ""
			}(),
			Status:    string(conversation.Status),
			Priority:  string(conversation.Priority),
			Tags:      conversation.Tags,
			UpdatedAt: time.Now(),
		}

		// Add participants data
		participants := make([]websocket.ParticipantData, len(conversation.Participants))
		for i, p := range conversation.Participants {
			isOnline := false
			var lastSeen *time.Time
			if s.wsManager != nil {
				presence := s.wsManager.GetUserPresence(p.UserID)
				isOnline = presence.IsOnline
				if !presence.LastSeen.IsZero() {
					lastSeen = &presence.LastSeen
				}
			}

			participants[i] = websocket.ParticipantData{
				UserID:   p.UserID,
				Role:     string(p.UserType),
				JoinedAt: p.JoinedAt,
				IsOnline: isOnline,
				LastSeen: lastSeen,
			}
		}
		conversationData.Participants = participants

		// Add unread count and last message info
		if !conversation.LastMessageAt.IsZero() {
			conversationData.LastMessageAt = &conversation.LastMessageAt
		}

		// Calculate unread count for the conversation
		totalUnread := 0
		for _, participant := range conversation.Participants {
			totalUnread += participant.UnreadCount
		}
		conversationData.UnreadCount = totalUnread

		// Add metadata about what changed
		conversationData.Metadata = map[string]interface{}{
			"changes":   changes,
			"updatedBy": userID,
		}

		s.wsManager.BroadcastConversationUpdated(conversationID, conversationData, &userID)

		s.logger.Info("Broadcasted conversation update",
			"conversationID", conversationID,
			"updatedBy", userID,
			"changeCount", len(changes))
	}

	s.logger.Info("Conversation updated successfully",
		"conversationID", conversationID,
		"updatedBy", userID,
		"changes", changes)

	return s.mapConversationToResponse(conversation, userID), nil
}

func (s *ChatService) ArchiveConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error {
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("access denied")
	}

	if err := s.chatRepo.ArchiveConversation(ctx, conversationID, true); err != nil {
		return err
	}

	// NEW: Broadcast conversation archived via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		s.wsManager.BroadcastConversationArchived(conversationID, userID)
	}

	return nil
}

func (s *ChatService) DeleteConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error {
	// Only admins or conversation creators can delete
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("access denied")
	}

	// Check if user is admin of the conversation
	participant, err := s.chatRepo.GetParticipantByUserAndConversation(ctx, userID, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get participant: %w", err)
	}
	if participant.UserType != models.ParticipantTypeAdmin {
		return errors.New("only conversation admins can delete conversations")
	}

	return s.chatRepo.DeleteConversation(ctx, conversationID)
}

// Message operations

func (s *ChatService) SendMessage(ctx context.Context, userID uuid.UUID, req *dto.SendMessageRequest) (*dto.ChatMessageResponse, error) {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, req.ConversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	// Get user info
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Determine sender type
	senderType := models.SenderTypeUser
	if user.Role == models.RoleAdmin {
		senderType = models.SenderTypeAdmin
	}

	// Create message
	message := &models.Message{
		ConversationID: req.ConversationID,
		SenderID:       userID,
		SenderName:     user.GetFullName(),
		SenderType:     senderType,
		Content:        req.Content,
		MessageType:    models.MessageType(req.Type),
	}

	// Set reply information if provided
	if req.ReplyToID != nil {
		// Validate that the reply-to message exists and is in the same conversation
		replyToMessage, err := s.chatRepo.GetMessageByID(ctx, *req.ReplyToID)
		if err != nil {
			return nil, fmt.Errorf("reply-to message not found: %w", err)
		}
		if replyToMessage.ConversationID != req.ConversationID {
			return nil, errors.New("reply-to message must be in the same conversation")
		}
	}

	// Add metadata if provided
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err == nil {
			metadataStr := string(metadataJSON)
			message.Metadata = &metadataStr
		}
	}

	if err := s.chatRepo.CreateMessage(ctx, message); err != nil {
		s.logger.Error("Failed to create message", "error", err)
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Create attachments if provided
	for _, attachmentReq := range req.Attachments {
		attachment := &models.MessageAttachment{
			MessageID:    message.ID,
			FileName:     attachmentReq.FileName,
			FileSize:     attachmentReq.FileSize,
			FileType:     attachmentReq.FileType,
			FileURL:      attachmentReq.FileURL,
			ThumbnailURL: &attachmentReq.ThumbnailURL,
		}

		if err := s.chatRepo.CreateMessageAttachment(ctx, attachment); err != nil {
			s.logger.Warn("Failed to create attachment",
				"messageID", message.ID,
				"fileName", attachmentReq.FileName,
				"error", err)
		}
	}

	// Get complete message with attachments
	completeMessage, err := s.chatRepo.GetMessageByID(ctx, message.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get complete message: %w", err)
	}

	// Broadcast message via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		messageData := websocket.MessageEventData{
			MessageID:      completeMessage.ID,
			ConversationID: completeMessage.ConversationID,
			UserID:         completeMessage.SenderID,
			Content:        completeMessage.Content,
			MessageType:    string(completeMessage.MessageType),
			CreatedAt:      completeMessage.CreatedAt,
		}

		// Add attachments if any
		if len(completeMessage.Attachments) > 0 {
			attachments := make([]websocket.AttachmentData, len(completeMessage.Attachments))
			for i, att := range completeMessage.Attachments {
				thumbnailURL := ""
				if att.ThumbnailURL != nil {
					thumbnailURL = *att.ThumbnailURL
				}

				attachments[i] = websocket.AttachmentData{
					ID:           att.ID,
					FileName:     att.FileName,
					FileSize:     att.FileSize,
					FileType:     att.FileType,
					FileURL:      att.FileURL,
					ThumbnailURL: thumbnailURL,
					UploadedAt:   att.CreatedAt,
				}
			}
			messageData.Attachments = attachments
		}

		// Add metadata if present
		if completeMessage.Metadata != nil {
			var metadata map[string]interface{}
			if err := json.Unmarshal([]byte(*completeMessage.Metadata), &metadata); err == nil {
				messageData.Metadata = metadata
			}
		}

		s.wsManager.BroadcastMessageSent(req.ConversationID, messageData, &userID)

		s.logger.Info("Broadcasted new message",
			"messageID", completeMessage.ID,
			"conversationID", req.ConversationID,
			"senderID", userID,
			"hasAttachments", len(completeMessage.Attachments) > 0)
	}

	s.logger.Info("Message sent successfully",
		"messageID", completeMessage.ID,
		"conversationID", req.ConversationID,
		"senderID", userID,
		"contentLength", len(completeMessage.Content),
		"attachmentCount", len(completeMessage.Attachments))

	return s.mapMessageToResponse(completeMessage, userID), nil
}

func (s *ChatService) GetMessages(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.GetMessagesRequest) (*dto.MessageListResponse, error) {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	messages, total, err := s.chatRepo.GetMessagesByConversationID(ctx, conversationID, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	response := &dto.MessageListResponse{
		Messages:   make([]dto.ChatMessageResponse, len(messages)),
		TotalCount: total,
		HasMore:    int64(req.Offset+req.Limit) < total,
	}

	// Set cursors for pagination
	if len(messages) > 0 {
		firstMessage := messages[0]
		lastMessage := messages[len(messages)-1]

		nextCursor := lastMessage.CreatedAt.Format(time.RFC3339)
		prevCursor := firstMessage.CreatedAt.Format(time.RFC3339)

		response.NextCursor = &nextCursor
		response.PrevCursor = &prevCursor
	}

	for i, message := range messages {
		response.Messages[i] = *s.mapMessageToResponse(&message, userID)
	}

	return response, nil
}

func (s *ChatService) UpdateMessage(ctx context.Context, userID uuid.UUID, messageID uuid.UUID, req *dto.UpdateMessageRequest) (*dto.ChatMessageResponse, error) {
	// Check permissions
	canModify, err := s.CanUserModifyMessage(ctx, userID, messageID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, errors.New("access denied")
	}

	message, err := s.chatRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("message not found")
		}
		return nil, fmt.Errorf("failed to get message: %w", err)
	}

	// Store original content for logging
	originalContent := message.Content

	// Update message
	message.Content = req.Content
	message.IsEdited = true
	now := time.Now()
	message.EditedAt = &now

	if err := s.chatRepo.UpdateMessage(ctx, message); err != nil {
		return nil, fmt.Errorf("failed to update message: %w", err)
	}

	// Broadcast message update via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		messageData := websocket.MessageEventData{
			MessageID:      message.ID,
			ConversationID: message.ConversationID,
			UserID:         message.SenderID,
			Content:        message.Content,
			MessageType:    string(message.MessageType),
			EditedAt:       message.EditedAt,
			CreatedAt:      message.CreatedAt,
		}

		// Add attachments if any
		if len(message.Attachments) > 0 {
			attachments := make([]websocket.AttachmentData, len(message.Attachments))
			for i, att := range message.Attachments {
				thumbnailURL := ""
				if att.ThumbnailURL != nil {
					thumbnailURL = *att.ThumbnailURL
				}

				attachments[i] = websocket.AttachmentData{
					ID:           att.ID,
					FileName:     att.FileName,
					FileSize:     att.FileSize,
					FileType:     att.FileType,
					FileURL:      att.FileURL,
					ThumbnailURL: thumbnailURL,
					UploadedAt:   att.CreatedAt,
				}
			}
			messageData.Attachments = attachments
		}

		// Add metadata if present
		if message.Metadata != nil {
			var metadata map[string]interface{}
			if err := json.Unmarshal([]byte(*message.Metadata), &metadata); err == nil {
				messageData.Metadata = metadata
			}
		}

		s.wsManager.BroadcastMessageUpdated(message.ConversationID, messageData, &userID)

		s.logger.Info("Broadcasted message update",
			"messageID", messageID,
			"conversationID", message.ConversationID,
			"userID", userID)
	}

	s.logger.Info("Message updated",
		"messageID", messageID,
		"userID", userID,
		"originalLength", len(originalContent),
		"newLength", len(message.Content))

	return s.mapMessageToResponse(message, userID), nil
}

func (s *ChatService) DeleteMessage(ctx context.Context, userID uuid.UUID, messageID uuid.UUID) error {
	// Get message info before deletion for broadcasting
	message, err := s.chatRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return fmt.Errorf("failed to get message: %w", err)
	}

	canModify, err := s.CanUserModifyMessage(ctx, userID, messageID)
	if err != nil {
		return err
	}
	if !canModify {
		return errors.New("access denied")
	}

	if err := s.chatRepo.DeleteMessage(ctx, messageID); err != nil {
		return err
	}

	// NEW: Broadcast message deletion via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		s.wsManager.BroadcastMessageDeleted(message.ConversationID, messageID, userID)
	}

	return nil
}
func (s *ChatService) SearchMessages(ctx context.Context, userID uuid.UUID, req *dto.SearchMessagesRequest) (*dto.MessageSearchResponse, error) {
	messages, total, err := s.chatRepo.SearchMessages(ctx, userID, req)
	if err != nil {
		return nil, fmt.Errorf("failed to search messages: %w", err)
	}

	response := &dto.MessageSearchResponse{
		Messages:   make([]dto.MessageSearchResult, len(messages)),
		TotalCount: total,
		HasMore:    int64(req.Offset+req.Limit) < total,
	}

	for i, message := range messages {
		messageResp := s.mapMessageToResponse(&message, userID)
		conversationResp := s.mapConversationToResponse(message.Conversation, userID)

		result := dto.MessageSearchResult{
			Message:      *messageResp,
			Conversation: *conversationResp,
			Score:        1.0, // TODO: Implement proper scoring
		}

		// Add highlights for search terms
		if strings.Contains(strings.ToLower(message.Content), strings.ToLower(req.Query)) {
			result.Highlights = []string{req.Query}
		}

		response.Messages[i] = result
	}

	return response, nil
}

// Participant operations

func (s *ChatService) AddParticipant(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.AddParticipantRequest) error {
	// Check permissions - only admins can add participants
	participant, err := s.chatRepo.GetParticipantByUserAndConversation(ctx, userID, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get participant: %w", err)
	}
	if participant.UserType != models.ParticipantTypeAdmin {
		return errors.New("only conversation admins can add participants")
	}

	// Check if user exists
	if _, err := s.userRepo.GetByID(req.UserID); err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Check if user is already a participant
	if exists, _ := s.chatRepo.IsUserParticipant(ctx, req.UserID, conversationID); exists {
		return errors.New("user is already a participant")
	}

	newParticipant := &models.ConversationParticipant{
		ConversationID: conversationID,
		UserID:         req.UserID,
		UserType:       models.ParticipantType(req.UserType),
	}

	return s.chatRepo.AddParticipant(ctx, newParticipant)
}

func (s *ChatService) RemoveParticipant(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, req *dto.RemoveParticipantRequest) error {
	// Check permissions - only admins can remove participants
	participant, err := s.chatRepo.GetParticipantByUserAndConversation(ctx, userID, conversationID)
	if err != nil {
		return fmt.Errorf("failed to get participant: %w", err)
	}
	if participant.UserType != models.ParticipantTypeAdmin {
		return errors.New("only conversation admins can remove participants")
	}

	return s.chatRepo.RemoveParticipant(ctx, conversationID, req.UserID)
}

func (s *ChatService) LeaveConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error {
	// Check if user is participant
	if exists, err := s.chatRepo.IsUserParticipant(ctx, userID, conversationID); err != nil {
		return err
	} else if !exists {
		return errors.New("user is not a participant")
	}

	return s.chatRepo.RemoveParticipant(ctx, conversationID, userID)
}

// Read receipt operations

func (s *ChatService) MarkMessagesAsRead(ctx context.Context, userID uuid.UUID, req *dto.MarkMessagesReadRequest) error {
	// Verify user has access to all messages
	conversationMessages := make(map[uuid.UUID][]uuid.UUID)

	for _, messageID := range req.MessageIDs {
		message, err := s.chatRepo.GetMessageByID(ctx, messageID)
		if err != nil {
			return fmt.Errorf("message %s not found: %w", messageID, err)
		}

		canAccess, err := s.CanUserAccessConversation(ctx, userID, message.ConversationID)
		if err != nil {
			return err
		}
		if !canAccess {
			return fmt.Errorf("access denied to message %s", messageID)
		}

		// Group messages by conversation for efficient broadcasting
		conversationMessages[message.ConversationID] = append(conversationMessages[message.ConversationID], messageID)
	}

	// Mark messages as read in database
	if err := s.chatRepo.MarkMultipleMessagesAsRead(ctx, req.MessageIDs, userID); err != nil {
		return fmt.Errorf("failed to mark messages as read: %w", err)
	}

	// Broadcast read receipts via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		readTime := time.Now()

		// Broadcast read receipts for each conversation
		for conversationID, messageIDs := range conversationMessages {
			readData := websocket.ReadReceiptEventData{
				ConversationID: conversationID,
				UserID:         userID,
				MessageIDs:     messageIDs,
				ReadAt:         readTime,
			}

			s.wsManager.BroadcastMessageRead(conversationID, readData, &userID)

			s.logger.Debug("Broadcasted read receipts",
				"conversationID", conversationID,
				"userID", userID,
				"messageCount", len(messageIDs))
		}
	}

	s.logger.Info("Marked messages as read",
		"userID", userID,
		"messageCount", len(req.MessageIDs),
		"conversationCount", len(conversationMessages))

	return nil
}

func (s *ChatService) GetReadReceipts(ctx context.Context, userID uuid.UUID, messageID uuid.UUID) ([]dto.ReadReceiptResponse, error) {
	message, err := s.chatRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	canAccess, err := s.CanUserAccessConversation(ctx, userID, message.ConversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	receipts, err := s.chatRepo.GetReadReceipts(ctx, messageID)
	if err != nil {
		return nil, fmt.Errorf("failed to get read receipts: %w", err)
	}

	response := make([]dto.ReadReceiptResponse, len(receipts))
	for i, receipt := range receipts {
		response[i] = dto.ReadReceiptResponse{
			ID:        receipt.ID,
			MessageID: receipt.MessageID,
			UserID:    receipt.UserID,
			User:      s.mapUserToInfo(receipt.User),
			ReadAt:    receipt.ReadAt,
		}
	}

	return response, nil
}

// File operations

func (s *ChatService) UploadFile(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*dto.FileUploadResponse, error) {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	// Validate file size (50MB max)
	const maxFileSize = 50 * 1024 * 1024
	if header.Size > maxFileSize {
		return nil, errors.New("file size exceeds maximum allowed size")
	}

	// Validate file type
	allowedTypes := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
		".pdf": true, ".doc": true, ".docx": true, ".txt": true,
		".mp4": true, ".webm": true, ".ogg": true,
		".mp3": true, ".wav": true,
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedTypes[ext] {
		return nil, errors.New("file type not allowed")
	}

	// TODO: Implement actual file upload to S3/MinIO
	// For now, return a mock response
	fileURL := fmt.Sprintf("/uploads/%s/%s", conversationID, header.Filename)

	response := &dto.FileUploadResponse{
		FileURL:  fileURL,
		FileName: header.Filename,
		FileSize: header.Size,
		FileType: header.Header.Get("Content-Type"),
	}

	// Generate thumbnail URL for images
	if strings.HasPrefix(response.FileType, "image/") {
		response.ThumbnailURL = fileURL + "_thumb"
	}

	return response, nil
}

func (s *ChatService) DeleteAttachment(ctx context.Context, userID uuid.UUID, attachmentID uuid.UUID) error {
	// TODO: Implement attachment deletion with permission checks
	return s.chatRepo.DeleteAttachment(ctx, attachmentID)
}

// Support agent operations

func (s *ChatService) CreateSupportAgent(ctx context.Context, adminUserID uuid.UUID, req *dto.CreateSupportAgentRequest) (*dto.SupportAgentResponse, error) {
	// Check if requester is admin
	admin, err := s.userRepo.GetByID(adminUserID)
	if err != nil {
		return nil, fmt.Errorf("admin user not found: %w", err)
	}
	if !admin.IsAdmin() {
		return nil, errors.New("only admins can create support agents")
	}

	// Check if user exists
	user, err := s.userRepo.GetByID(req.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if user is already a support agent
	if existing, _ := s.chatRepo.GetSupportAgentByID(ctx, req.UserID); existing != nil {
		return nil, errors.New("user is already a support agent")
	}

	agent := &models.SupportAgent{
		ID:         req.UserID,
		Department: req.Department,
		Status:     models.AgentStatusOffline,
		Rating:     0.0,
	}

	if err := s.chatRepo.CreateSupportAgent(ctx, agent); err != nil {
		return nil, fmt.Errorf("failed to create support agent: %w", err)
	}

	response := &dto.SupportAgentResponse{
		ID:         agent.ID,
		Department: agent.Department,
		Status:     string(agent.Status),
		Rating:     agent.Rating,
		LastSeenAt: agent.LastSeenAt,
		CreatedAt:  agent.CreatedAt,
		UpdatedAt:  agent.UpdatedAt,
		User:       s.mapUserToInfo(user),
	}

	return response, nil
}

// Support agent operations (continued)

func (s *ChatService) GetSupportAgents(ctx context.Context, department string, status string, limit, offset int) (*dto.SupportAgentListResponse, error) {
	agents, total, err := s.chatRepo.GetSupportAgents(ctx, department, status, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get support agents: %w", err)
	}

	response := &dto.SupportAgentListResponse{
		Agents:     make([]dto.SupportAgentResponse, len(agents)),
		TotalCount: total,
		HasMore:    int64(offset+limit) < total,
	}

	for i, agent := range agents {
		response.Agents[i] = dto.SupportAgentResponse{
			ID:         agent.ID,
			Department: agent.Department,
			Status:     string(agent.Status),
			Rating:     agent.Rating,
			LastSeenAt: agent.LastSeenAt,
			CreatedAt:  agent.CreatedAt,
			UpdatedAt:  agent.UpdatedAt,
			User:       s.mapUserToInfo(agent.User),
		}
	}

	return response, nil
}

func (s *ChatService) UpdateSupportAgent(ctx context.Context, agentID uuid.UUID, req *dto.UpdateSupportAgentRequest) (*dto.SupportAgentResponse, error) {
	agent, err := s.chatRepo.GetSupportAgentByID(ctx, agentID)
	if err != nil {
		return nil, fmt.Errorf("agent not found: %w", err)
	}

	if req.Department != nil {
		agent.Department = *req.Department
	}
	if req.Status != nil {
		agent.Status = models.AgentStatus(*req.Status)
	}

	if err := s.chatRepo.UpdateSupportAgent(ctx, agent); err != nil {
		return nil, fmt.Errorf("failed to update agent: %w", err)
	}

	return &dto.SupportAgentResponse{
		ID:         agent.ID,
		Department: agent.Department,
		Status:     string(agent.Status),
		Rating:     agent.Rating,
		LastSeenAt: agent.LastSeenAt,
		CreatedAt:  agent.CreatedAt,
		UpdatedAt:  agent.UpdatedAt,
		User:       s.mapUserToInfo(agent.User),
	}, nil
}

func (s *ChatService) AssignAgent(ctx context.Context, adminUserID uuid.UUID, conversationID uuid.UUID, req *dto.AssignAgentRequest) error {
	// Check if requester is admin
	admin, err := s.userRepo.GetByID(adminUserID)
	if err != nil {
		return fmt.Errorf("admin user not found: %w", err)
	}
	if !admin.IsAdmin() {
		return errors.New("only admins can assign agents")
	}

	// Verify agent exists
	if _, err := s.chatRepo.GetSupportAgentByID(ctx, req.AgentID); err != nil {
		return fmt.Errorf("agent not found: %w", err)
	}

	// Update conversation
	conversation, err := s.chatRepo.GetConversationByID(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}

	conversation.AssignedAgentID = &req.AgentID
	return s.chatRepo.UpdateConversation(ctx, conversation)
}

func (s *ChatService) UpdateAgentStatus(ctx context.Context, agentID uuid.UUID, status string) error {
	return s.chatRepo.UpdateAgentStatus(ctx, agentID, status)
}

func (s *ChatService) GetAvailableAgents(ctx context.Context, department string) ([]dto.SupportAgentResponse, error) {
	agents, err := s.chatRepo.GetAvailableAgents(ctx, department)
	if err != nil {
		return nil, fmt.Errorf("failed to get available agents: %w", err)
	}

	response := make([]dto.SupportAgentResponse, len(agents))
	for i, agent := range agents {
		response[i] = dto.SupportAgentResponse{
			ID:         agent.ID,
			Department: agent.Department,
			Status:     string(agent.Status),
			Rating:     agent.Rating,
			LastSeenAt: agent.LastSeenAt,
			CreatedAt:  agent.CreatedAt,
			UpdatedAt:  agent.UpdatedAt,
			User:       s.mapUserToInfo(agent.User),
		}
	}

	return response, nil
}

// Real-time operations

func (s *ChatService) SetTypingStatus(ctx context.Context, userID uuid.UUID, req *dto.SetTypingStatusRequest) error {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, req.ConversationID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("access denied")
	}

	// NEW: Broadcast typing status via WebSocket
	if s.wsManager != nil && s.wsManager.IsRunning() {
		s.wsManager.BroadcastUserTyping(req.ConversationID, userID, req.IsTyping)
	}

	return nil
}

func (s *ChatService) GetOnlineUsers(ctx context.Context, conversationID uuid.UUID) (*dto.OnlineUsersResponse, error) {
	// Get conversation participants
	participants, err := s.chatRepo.GetParticipants(ctx, conversationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get participants: %w", err)
	}

	// NEW: Filter for online users using WebSocket manager
	var users []dto.UserInfo
	onlineCount := 0

	if s.wsManager != nil && s.wsManager.IsRunning() {
		// Get online users from WebSocket manager
		onlineUserIDs := s.wsManager.GetOnlineUsers(conversationID)
		onlineUserMap := make(map[uuid.UUID]bool)
		for _, userID := range onlineUserIDs {
			onlineUserMap[userID] = true
		}

		// Filter participants to only include online users
		for _, participant := range participants {
			if participant.User != nil && onlineUserMap[participant.UserID] {
				users = append(users, s.mapUserToInfo(participant.User))
				onlineCount++
			}
		}
	} else {
		// Fallback: return all participants if WebSocket manager not available
		for _, participant := range participants {
			if participant.User != nil {
				users = append(users, s.mapUserToInfo(participant.User))
			}
		}
		onlineCount = len(users)
	}

	return &dto.OnlineUsersResponse{
		Users:      users,
		TotalCount: onlineCount,
	}, nil
}

// Analytics and statistics

func (s *ChatService) GetConversationStats(ctx context.Context, userID uuid.UUID, req *dto.ConversationStatsRequest) (*dto.ConversationStatsResponse, error) {
	// Check if user is admin for full stats
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	if !user.IsAdmin() {
		return nil, errors.New("only admins can view conversation statistics")
	}

	return s.chatRepo.GetConversationStats(ctx, req)
}

func (s *ChatService) GetConversationSummary(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (*dto.ConversationSummaryResponse, error) {
	// Check permissions
	canAccess, err := s.CanUserAccessConversation(ctx, userID, conversationID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("access denied")
	}

	conversation, err := s.chatRepo.GetConversationByID(ctx, conversationID)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	// Get message count
	messageCount := int64(len(conversation.Messages))
	participantCount := len(conversation.Participants)

	// Calculate duration
	duration := time.Since(conversation.CreatedAt).String()

	return &dto.ConversationSummaryResponse{
		ConversationID:   conversation.ID,
		MessageCount:     messageCount,
		ParticipantCount: participantCount,
		StartedAt:        conversation.CreatedAt,
		LastActivityAt:   conversation.LastMessageAt,
		Duration:         duration,
		Status:           string(conversation.Status),
		Priority:         string(conversation.Priority),
		Tags:             conversation.Tags,
	}, nil
}

// System operations

func (s *ChatService) CreateSystemMessage(ctx context.Context, conversationID uuid.UUID, messageType string, content string, metadata map[string]interface{}) error {
	message := &models.Message{
		ConversationID: conversationID,
		SenderID:       uuid.Nil, // System message
		SenderName:     "System",
		SenderType:     models.SenderTypeBot,
		Content:        content,
		MessageType:    models.MessageType(messageType),
	}

	if metadata != nil {
		metadataJSON, err := json.Marshal(metadata)
		if err == nil {
			metadataStr := string(metadataJSON)
			message.Metadata = &metadataStr
		}
	}

	return s.chatRepo.CreateMessage(ctx, message)
}

func (s *ChatService) CleanupOldMessages(ctx context.Context, retentionDays int) error {
	return s.chatRepo.CleanupOldMessages(ctx, retentionDays)
}

// Permission helpers

func (s *ChatService) CanUserAccessConversation(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (bool, error) {
	return s.chatRepo.IsUserParticipant(ctx, userID, conversationID)
}

func (s *ChatService) CanUserModifyMessage(ctx context.Context, userID uuid.UUID, messageID uuid.UUID) (bool, error) {
	message, err := s.chatRepo.GetMessageByID(ctx, messageID)
	if err != nil {
		return false, err
	}

	// User can modify their own messages or admins can modify any message
	if message.SenderID == userID {
		return true, nil
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return false, err
	}

	return user.IsAdmin(), nil
}

func (s *ChatService) IsUserAgent(ctx context.Context, userID uuid.UUID) (bool, error) {
	_, err := s.chatRepo.GetSupportAgentByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Mapping helper functions

func (s *ChatService) mapConversationToResponse(conversation *models.Conversation, userID uuid.UUID) *dto.ConversationResponse {
	response := &dto.ConversationResponse{
		ID:              conversation.ID,
		Title:           conversation.Title,
		Participants:    make([]dto.ConversationParticipantResponse, len(conversation.Participants)),
		LastMessageAt:   conversation.LastMessageAt,
		IsArchived:      conversation.IsArchived,
		Tags:            conversation.Tags,
		Priority:        string(conversation.Priority),
		Status:          string(conversation.Status),
		AssignedAgentID: conversation.AssignedAgentID,
		CreatedAt:       conversation.CreatedAt,
		UpdatedAt:       conversation.UpdatedAt,
	}

	// Map participants
	for i, participant := range conversation.Participants {
		response.Participants[i] = dto.ConversationParticipantResponse{
			ID:          participant.ID,
			UserID:      participant.UserID,
			UserType:    string(participant.UserType),
			JoinedAt:    participant.JoinedAt,
			UnreadCount: participant.UnreadCount,
			User:        s.mapUserToInfo(participant.User),
		}

		// Set unread count for current user
		if participant.UserID == userID {
			response.UnreadCount = participant.UnreadCount
		}
	}

	// Map assigned agent if present
	if conversation.AssignedAgent != nil {
		response.AssignedAgent = &dto.SupportAgentInfo{
			ID:         conversation.AssignedAgent.ID,
			Department: "", // Would need to get from support_agents table
			Status:     "offline",
			Rating:     0.0,
			LastSeenAt: time.Now(),
			User:       s.mapUserToInfo(conversation.AssignedAgent),
		}
	}

	// Map last message if present
	if len(conversation.Messages) > 0 {
		lastMessage := conversation.Messages[0]
		response.LastMessage = s.mapMessageToResponse(&lastMessage, userID)
	}

	return response
}

func (s *ChatService) mapMessageToResponse(message *models.Message, userID uuid.UUID) *dto.ChatMessageResponse {
	response := &dto.ChatMessageResponse{
		ID:             message.ID,
		ConversationID: message.ConversationID,
		SenderID:       message.SenderID,
		SenderName:     message.SenderName,
		SenderType:     string(message.SenderType),
		Content:        message.Content,
		Type:           string(message.MessageType),
		IsEdited:       message.IsEdited,
		EditedAt:       message.EditedAt,
		Attachments:    make([]dto.AttachmentResponse, len(message.Attachments)),
		Timestamp:      message.CreatedAt,
		CreatedAt:      message.CreatedAt,
		UpdatedAt:      message.UpdatedAt,
	}

	// Check if message is read by current user
	for _, receipt := range message.ReadReceipts {
		if receipt.UserID == userID {
			response.IsRead = true
			break
		}
	}

	// Map attachments
	for i, attachment := range message.Attachments {
		response.Attachments[i] = dto.AttachmentResponse{
			ID:           attachment.ID,
			MessageID:    attachment.MessageID,
			FileName:     attachment.FileName,
			FileSize:     attachment.FileSize,
			FileType:     attachment.FileType,
			FileURL:      attachment.FileURL,
			ThumbnailURL: attachment.ThumbnailURL,
			CreatedAt:    attachment.CreatedAt,
		}
	}

	// Parse metadata
	if message.Metadata != nil {
		var metadata map[string]interface{}
		if err := json.Unmarshal([]byte(*message.Metadata), &metadata); err == nil {
			response.Metadata = metadata
		}
	}

	return response
}

func (s *ChatService) mapUserToInfo(user *models.User) dto.UserInfo {
	if user == nil {
		return dto.UserInfo{}
	}

	return dto.UserInfo{
		ID:             user.ID,
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		Email:          user.Email,
		Role:           string(user.Role),
		ProfilePicture: user.ProfilePicture,
		Department:     user.Department,
		Position:       user.Position,
		IsActive:       user.IsActive,
		LastLoginAt:    user.LastLoginAt,
	}
}
