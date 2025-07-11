// internal/handlers/chat_handler.go
package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"log/slog"
	"room-reservation-api/internal/dto"
	"room-reservation-api/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ChatHandler struct {
	chatService *services.ChatService
	logger      *slog.Logger
}

// NewChatHandler creates a new chat handler instance
func NewChatHandler(chatService *services.ChatService, logger *slog.Logger) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
		logger:      logger,
	}
}

// Conversation endpoints

// CreateConversation godoc
// @Summary Create a new conversation
// @Description Create a new conversation with participants
// @Tags conversations
// @Accept json
// @Produce json
// @Param conversation body dto.CreateConversationRequest true "Conversation data"
// @Success 201 {object} dto.ConversationResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations [post]
func (h *ChatHandler) CreateConversation(c *gin.Context) {
	var req dto.CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	conversation, err := h.chatService.CreateConversation(c.Request.Context(), userID, &req)
	if err != nil {
		h.logger.Error("Failed to create conversation", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to create conversation",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusCreated, conversation)
}

// GetConversations godoc
// @Summary Get user's conversations
// @Description Get a paginated list of conversations for the authenticated user
// @Tags conversations
// @Accept json
// @Produce json
// @Param status query string false "Filter by status (active, resolved, pending)"
// @Param priority query string false "Filter by priority (low, normal, high, urgent)"
// @Param is_archived query boolean false "Filter by archived status"
// @Param tag query string false "Filter by tag"
// @Param search query string false "Search in conversation titles and messages"
// @Param limit query int false "Limit number of results" default(20)
// @Param offset query int false "Offset for pagination" default(0)
// @Param sort_by query string false "Sort field (created_at, updated_at, last_message_at)" default(last_message_at)
// @Param sort_order query string false "Sort order (asc, desc)" default(desc)
// @Success 200 {object} dto.ConversationListResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations [get]
func (h *ChatHandler) GetConversations(c *gin.Context) {
	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	var req dto.GetConversationsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		h.logger.Warn("Invalid query parameters", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid query parameters",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Set defaults
	if req.Limit == 0 {
		req.Limit = 20
	}
	if req.SortBy == "" {
		req.SortBy = "last_message_at"
	}
	if req.SortOrder == "" {
		req.SortOrder = "desc"
	}

	conversations, err := h.chatService.GetConversations(c.Request.Context(), userID, &req)
	if err != nil {
		h.logger.Error("Failed to get conversations", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get conversations",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, conversations)
}

// GetConversation godoc
// @Summary Get a specific conversation
// @Description Get conversation details by ID
// @Tags conversations
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Success 200 {object} dto.ConversationResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id} [get]
func (h *ChatHandler) GetConversation(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	conversation, err := h.chatService.GetConversation(c.Request.Context(), userID, conversationID)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to access this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}
		if err.Error() == "conversation not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:      "Not found",
				Message:    "Conversation not found",
				StatusCode: http.StatusNotFound,
			})
			return
		}

		h.logger.Error("Failed to get conversation", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get conversation",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, conversation)
}

// UpdateConversation godoc
// @Summary Update a conversation
// @Description Update conversation details (status, priority, etc.)
// @Tags conversations
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Param conversation body dto.UpdateConversationRequest true "Update data"
// @Success 200 {object} dto.ConversationResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id} [put]
func (h *ChatHandler) UpdateConversation(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	conversation, err := h.chatService.UpdateConversation(c.Request.Context(), userID, conversationID, &req)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to update this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to update conversation", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to update conversation",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, conversation)
}

// ArchiveConversation godoc
// @Summary Archive a conversation
// @Description Archive a conversation (soft delete)
// @Tags conversations
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/archive [post]
func (h *ChatHandler) ArchiveConversation(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.ArchiveConversation(c.Request.Context(), userID, conversationID); err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to archive this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to archive conversation", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to archive conversation",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Conversation archived successfully",
	})
}

// DeleteConversation godoc
// @Summary Delete a conversation
// @Description Permanently delete a conversation (admin only)
// @Tags conversations
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id} [delete]
func (h *ChatHandler) DeleteConversation(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.DeleteConversation(c.Request.Context(), userID, conversationID); err != nil {
		if err.Error() == "access denied" || err.Error() == "only conversation admins can delete conversations" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    err.Error(),
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to delete conversation", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to delete conversation",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Conversation deleted successfully",
	})
}

// Message endpoints

// GetMessages godoc
// @Summary Get conversation messages
// @Description Get paginated messages for a conversation
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Param limit query int false "Limit number of results" default(50)
// @Param offset query int false "Offset for pagination" default(0)
// @Param before query string false "Get messages before this timestamp (RFC3339)"
// @Param after query string false "Get messages after this timestamp (RFC3339)"
// @Param message_type query string false "Filter by message type"
// @Success 200 {object} dto.MessageListResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/messages [get]
func (h *ChatHandler) GetMessages(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.GetMessagesRequest
	req.ConversationID = conversationID
	if err := c.ShouldBindQuery(&req); err != nil {
		h.logger.Warn("Invalid query parameters", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid query parameters",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Set defaults
	if req.Limit == 0 {
		req.Limit = 50
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	messages, err := h.chatService.GetMessages(c.Request.Context(), userID, conversationID, &req)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to access this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to get messages", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get messages",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, messages)
}

// SendMessage godoc
// @Summary Send a message
// @Description Send a new message to a conversation
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Param message body dto.SendMessageRequest true "Message data"
// @Success 201 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/messages [post]
func (h *ChatHandler) SendMessage(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Set conversation ID from URL
	req.ConversationID = conversationID

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	message, err := h.chatService.SendMessage(c.Request.Context(), userID, &req)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to send messages to this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to send message", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to send message",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusCreated, message)
}

// UpdateMessage godoc
// @Summary Update a message
// @Description Update/edit a message (sender only)
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Param message body dto.UpdateMessageRequest true "Update data"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/messages/{id} [put]
func (h *ChatHandler) UpdateMessage(c *gin.Context) {
	messageID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid message ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	message, err := h.chatService.UpdateMessage(c.Request.Context(), userID, messageID, &req)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You can only edit your own messages",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to update message", "userID", userID, "messageID", messageID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to update message",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, message)
}

// DeleteMessage godoc
// @Summary Delete a message
// @Description Delete a message (sender only)
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/messages/{id} [delete]
func (h *ChatHandler) DeleteMessage(c *gin.Context) {
	messageID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid message ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.DeleteMessage(c.Request.Context(), userID, messageID); err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You can only delete your own messages",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to delete message", "userID", userID, "messageID", messageID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to delete message",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Message deleted successfully",
	})
}

// Read receipt and other endpoints

// MarkMessagesAsRead godoc
// @Summary Mark messages as read
// @Description Mark multiple messages as read
// @Tags messages
// @Accept json
// @Produce json
// @Param request body dto.MarkMessagesReadRequest true "Message IDs to mark as read"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/messages/read [put]
func (h *ChatHandler) MarkMessagesAsRead(c *gin.Context) {
	var req dto.MarkMessagesReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.MarkMessagesAsRead(c.Request.Context(), userID, &req); err != nil {
		if err.Error() == "access denied to message" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to mark these messages as read",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to mark messages as read", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to mark messages as read",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Messages marked as read successfully",
	})
}

// GetReadReceipts godoc
// @Summary Get read receipts for a message
// @Description Get list of users who have read a message
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Success 200 {array} dto.ReadReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/messages/{id}/receipts [get]
func (h *ChatHandler) GetReadReceipts(c *gin.Context) {
	messageID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid message ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	receipts, err := h.chatService.GetReadReceipts(c.Request.Context(), userID, messageID)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to view read receipts for this message",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to get read receipts", "userID", userID, "messageID", messageID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get read receipts",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, receipts)
}

// SearchMessages godoc
// @Summary Search messages
// @Description Search messages across user's conversations
// @Tags messages
// @Accept json
// @Produce json
// @Param query query string true "Search query"
// @Param conversation_id query string false "Filter by conversation ID"
// @Param message_type query string false "Filter by message type"
// @Param sender_id query string false "Filter by sender ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param limit query int false "Limit number of results" default(20)
// @Param offset query int false "Offset for pagination" default(0)
// @Success 200 {object} dto.MessageSearchResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/messages/search [get]
func (h *ChatHandler) SearchMessages(c *gin.Context) {
	var req dto.SearchMessagesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		h.logger.Warn("Invalid query parameters", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid query parameters",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Set defaults
	if req.Limit == 0 {
		req.Limit = 20
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	results, err := h.chatService.SearchMessages(c.Request.Context(), userID, &req)
	if err != nil {
		h.logger.Error("Failed to search messages", "userID", userID, "query", req.Query, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to search messages",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, results)
}

// Participant management endpoints

// AddParticipant godoc
// @Summary Add participant to conversation
// @Description Add a new participant to a conversation (admin only)
// @Tags participants
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Param participant body dto.AddParticipantRequest true "Participant data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/participants [post]
func (h *ChatHandler) AddParticipant(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.AddParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.AddParticipant(c.Request.Context(), userID, conversationID, &req); err != nil {
		if err.Error() == "only conversation admins can add participants" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    err.Error(),
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to add participant", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to add participant",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Participant added successfully",
	})
}

// RemoveParticipant godoc
// @Summary Remove participant from conversation
// @Description Remove a participant from a conversation (admin only)
// @Tags participants
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Param participant body dto.RemoveParticipantRequest true "Participant data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/participants [delete]
func (h *ChatHandler) RemoveParticipant(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.RemoveParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.RemoveParticipant(c.Request.Context(), userID, conversationID, &req); err != nil {
		if err.Error() == "only conversation admins can remove participants" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    err.Error(),
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to remove participant", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to remove participant",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Participant removed successfully",
	})
}

// LeaveConversation godoc
// @Summary Leave a conversation
// @Description Leave a conversation (remove self as participant)
// @Tags participants
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/leave [post]
func (h *ChatHandler) LeaveConversation(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.LeaveConversation(c.Request.Context(), userID, conversationID); err != nil {
		if err.Error() == "user is not a participant" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You are not a participant in this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to leave conversation", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to leave conversation",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Left conversation successfully",
	})
}

// File upload endpoints

// UploadFile godoc
// @Summary Upload file for chat
// @Description Upload a file to be used as attachment in messages
// @Tags files
// @Accept multipart/form-data
// @Produce json
// @Param conversation_id formData string true "Conversation ID"
// @Param file formData file true "File to upload"
// @Success 200 {object} dto.FileUploadResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 413 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/upload [post]
func (h *ChatHandler) UploadFile(c *gin.Context) {
	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil { // 50MB max
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid form data",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Get conversation ID
	conversationIDStr := c.PostForm("conversation_id")
	if conversationIDStr == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Missing conversation ID",
			Message:    "conversation_id is required",
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	conversationID, err := uuid.Parse(conversationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Get file from form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "No file provided",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}
	defer file.Close()

	// Upload file
	uploadResponse, err := h.chatService.UploadFile(c.Request.Context(), userID, conversationID, file, header)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to upload files to this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}
		if err.Error() == "file size exceeds maximum allowed size" {
			c.JSON(http.StatusRequestEntityTooLarge, dto.ErrorResponse{
				Error:      "File too large",
				Message:    err.Error(),
				StatusCode: http.StatusRequestEntityTooLarge,
			})
			return
		}
		if err.Error() == "file type not allowed" {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:      "Invalid file type",
				Message:    err.Error(),
				StatusCode: http.StatusBadRequest,
			})
			return
		}

		h.logger.Error("Failed to upload file", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to upload file",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, uploadResponse)
}

// Support agent endpoints

// GetSupportAgents godoc
// @Summary Get support agents
// @Description Get list of support agents with optional filtering
// @Tags agents
// @Accept json
// @Produce json
// @Param department query string false "Filter by department"
// @Param status query string false "Filter by status (online, away, offline)"
// @Param limit query int false "Limit number of results" default(20)
// @Param offset query int false "Offset for pagination" default(0)
// @Success 200 {object} dto.SupportAgentListResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/agents [get]
func (h *ChatHandler) GetSupportAgents(c *gin.Context) {
	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	department := c.Query("department")
	status := c.Query("status")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	agents, err := h.chatService.GetSupportAgents(c.Request.Context(), department, status, limit, offset)
	if err != nil {
		h.logger.Error("Failed to get support agents", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get support agents",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, agents)
}

// CreateSupportAgent godoc
// @Summary Create support agent
// @Description Create a new support agent (admin only)
// @Tags agents
// @Accept json
// @Produce json
// @Param agent body dto.CreateSupportAgentRequest true "Agent data"
// @Success 201 {object} dto.SupportAgentResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/agents [post]
func (h *ChatHandler) CreateSupportAgent(c *gin.Context) {
	var req dto.CreateSupportAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	agent, err := h.chatService.CreateSupportAgent(c.Request.Context(), userID, &req)
	if err != nil {
		if err.Error() == "only admins can create support agents" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    err.Error(),
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to create support agent", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to create support agent",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusCreated, agent)
}

// AssignAgent godoc
// @Summary Assign agent to conversation
// @Description Assign a support agent to a conversation (admin only)
// @Tags agents
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Param assignment body dto.AssignAgentRequest true "Assignment data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/assign-agent [post]
func (h *ChatHandler) AssignAgent(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.AssignAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.AssignAgent(c.Request.Context(), userID, conversationID, &req); err != nil {
		if err.Error() == "only admins can assign agents" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    err.Error(),
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to assign agent", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to assign agent",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Agent assigned successfully",
	})
}

// Analytics endpoints

// GetConversationStats godoc
// @Summary Get conversation statistics
// @Description Get conversation analytics and statistics (admin only)
// @Tags analytics
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param agent_id query string false "Filter by agent ID"
// @Param department query string false "Filter by department"
// @Param group_by query string false "Group by (day, week, month, agent, department)"
// @Success 200 {object} dto.ConversationStatsResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/stats [get]
func (h *ChatHandler) GetConversationStats(c *gin.Context) {
	var req dto.ConversationStatsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		h.logger.Warn("Invalid query parameters", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid query parameters",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	stats, err := h.chatService.GetConversationStats(c.Request.Context(), userID, &req)
	if err != nil {
		if err.Error() == "only admins can view conversation statistics" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    err.Error(),
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to get conversation stats", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get conversation statistics",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetConversationSummary godoc
// @Summary Get conversation summary
// @Description Get summary information about a specific conversation
// @Tags analytics
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Success 200 {object} dto.ConversationSummaryResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/summary [get]
func (h *ChatHandler) GetConversationSummary(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	summary, err := h.chatService.GetConversationSummary(c.Request.Context(), userID, conversationID)
	if err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to view this conversation summary",
				StatusCode: http.StatusForbidden,
			})
			return
		}
		if err.Error() == "conversation not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:      "Not found",
				Message:    "Conversation not found",
				StatusCode: http.StatusNotFound,
			})
			return
		}

		h.logger.Error("Failed to get conversation summary", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get conversation summary",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// UpdateSupportAgent godoc
// @Summary Update support agent
// @Description Update support agent information
// @Tags agents
// @Accept json
// @Produce json
// @Param id path string true "Agent ID"
// @Param agent body dto.UpdateSupportAgentRequest true "Agent update data"
// @Success 200 {object} dto.SupportAgentResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/agents/{id} [put]
func (h *ChatHandler) UpdateSupportAgent(c *gin.Context) {
	agentID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid agent ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateSupportAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	agent, err := h.chatService.UpdateSupportAgent(c.Request.Context(), agentID, &req)
	if err != nil {
		if err.Error() == "agent not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:      "Not found",
				Message:    "Support agent not found",
				StatusCode: http.StatusNotFound,
			})
			return
		}

		h.logger.Error("Failed to update support agent", "userID", userID, "agentID", agentID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to update support agent",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, agent)
}

// GetAvailableAgents godoc
// @Summary Get available agents
// @Description Get list of available (online/away) support agents
// @Tags agents
// @Accept json
// @Produce json
// @Param department query string false "Filter by department"
// @Success 200 {array} dto.SupportAgentResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/agents/available [get]
func (h *ChatHandler) GetAvailableAgents(c *gin.Context) {
	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	department := c.Query("department")

	agents, err := h.chatService.GetAvailableAgents(c.Request.Context(), department)
	if err != nil {
		h.logger.Error("Failed to get available agents", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get available agents",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, agents)
}

// UpdateAgentStatus godoc
// @Summary Update agent status
// @Description Update agent online status (agent only)
// @Tags agents
// @Accept json
// @Produce json
// @Param status query string true "Status (online, away, offline)"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/agents/status [put]
func (h *ChatHandler) UpdateAgentStatus(c *gin.Context) {
	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	status := c.Query("status")
	if status == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Missing status",
			Message:    "Status parameter is required",
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"online":  true,
		"away":    true,
		"offline": true,
	}
	if !validStatuses[status] {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid status",
			Message:    "Status must be one of: online, away, offline",
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	// Check if user is an agent
	isAgent, err := h.chatService.IsUserAgent(c.Request.Context(), userID)
	if err != nil {
		h.logger.Error("Failed to check agent status", "userID", userID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to check agent status",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}
	if !isAgent {
		c.JSON(http.StatusForbidden, dto.ErrorResponse{
			Error:      "Access denied",
			Message:    "Only support agents can update their status",
			StatusCode: http.StatusForbidden,
		})
		return
	}

	if err := h.chatService.UpdateAgentStatus(c.Request.Context(), userID, status); err != nil {
		h.logger.Error("Failed to update agent status", "userID", userID, "status", status, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to update agent status",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Agent status updated successfully",
	})
}

// SetTypingStatus godoc
// @Summary Set typing status
// @Description Set typing status for a conversation
// @Tags real-time
// @Accept json
// @Produce json
// @Param typing body dto.SetTypingStatusRequest true "Typing status data"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/typing [post]
func (h *ChatHandler) SetTypingStatus(c *gin.Context) {
	var req dto.SetTypingStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Warn("Invalid request body", "error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid request",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	if err := h.chatService.SetTypingStatus(c.Request.Context(), userID, &req); err != nil {
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Error:      "Access denied",
				Message:    "You don't have permission to set typing status for this conversation",
				StatusCode: http.StatusForbidden,
			})
			return
		}

		h.logger.Error("Failed to set typing status", "userID", userID, "conversationID", req.ConversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to set typing status",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Typing status updated successfully",
	})
}

// GetOnlineUsers godoc
// @Summary Get online users
// @Description Get list of online users in a conversation
// @Tags real-time
// @Accept json
// @Produce json
// @Param id path string true "Conversation ID"
// @Success 200 {object} dto.OnlineUsersResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /chat/conversations/{id}/online [get]
func (h *ChatHandler) GetOnlineUsers(c *gin.Context) {
	conversationID, err := h.getUUIDFromParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:      "Invalid conversation ID",
			Message:    err.Error(),
			StatusCode: http.StatusBadRequest,
		})
		return
	}

	userID := h.getUserIDFromContext(c)
	if userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:      "Unauthorized",
			Message:    "User ID not found in context",
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	// Check permissions
	canAccess, err := h.chatService.CanUserAccessConversation(c.Request.Context(), userID, conversationID)
	if err != nil {
		h.logger.Error("Failed to check conversation access", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to check access permissions",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}
	if !canAccess {
		c.JSON(http.StatusForbidden, dto.ErrorResponse{
			Error:      "Access denied",
			Message:    "You don't have permission to view online users for this conversation",
			StatusCode: http.StatusForbidden,
		})
		return
	}

	onlineUsers, err := h.chatService.GetOnlineUsers(c.Request.Context(), conversationID)
	if err != nil {
		h.logger.Error("Failed to get online users", "userID", userID, "conversationID", conversationID, "error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:      "Failed to get online users",
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, onlineUsers)
}

// Helper functions

// getUserIDFromContext extracts user ID from Gin context (assumes auth middleware sets it)
func (h *ChatHandler) getUserIDFromContext(c *gin.Context) uuid.UUID {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil
	}

	userID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		// Try to parse as string if it's not directly UUID
		userIDStr, ok := userIDInterface.(string)
		if !ok {
			return uuid.Nil
		}

		parsed, err := uuid.Parse(userIDStr)
		if err != nil {
			return uuid.Nil
		}
		return parsed
	}

	return userID
}

// getUUIDFromParam extracts UUID from URL parameter
func (h *ChatHandler) getUUIDFromParam(c *gin.Context, param string) (uuid.UUID, error) {
	paramStr := c.Param(param)
	if paramStr == "" {
		return uuid.Nil, fmt.Errorf("missing %s parameter", param)
	}

	id, err := uuid.Parse(paramStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid %s format: %w", param, err)
	}

	return id, nil
}
