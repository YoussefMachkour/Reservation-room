// internal/utils/response.go
package utils

import (
	"time"
)

// APIResponse represents the standard API response format
type APIResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Error     interface{} `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	RequestID string      `json:"request_id,omitempty"`
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Message    string         `json:"message"`
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
	Timestamp  time.Time      `json:"timestamp"`
	RequestID  string         `json:"request_id,omitempty"`
}

// SuccessResponse creates a successful API response
func SuccessResponse(message string, data interface{}) APIResponse {
	return APIResponse{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
	}
}

// ErrorResponse creates an error API response
func ErrorResponse(message string, err interface{}) APIResponse {
	return APIResponse{
		Success:   false,
		Message:   message,
		Error:     err,
		Timestamp: time.Now(),
	}
}

// SuccessResponseWithRequestID creates a successful API response with request ID
func SuccessResponseWithRequestID(message string, data interface{}, requestID string) APIResponse {
	return APIResponse{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
		RequestID: requestID,
	}
}

// ErrorResponseWithRequestID creates an error API response with request ID
func ErrorResponseWithRequestID(message string, err interface{}, requestID string) APIResponse {
	return APIResponse{
		Success:   false,
		Message:   message,
		Error:     err,
		Timestamp: time.Now(),
		RequestID: requestID,
	}
}

// PaginatedSuccessResponse creates a successful paginated API response
func PaginatedSuccessResponse(message string, data interface{}, pagination PaginationMeta) PaginatedResponse {
	return PaginatedResponse{
		Success:    true,
		Message:    message,
		Data:       data,
		Pagination: pagination,
		Timestamp:  time.Now(),
	}
}

// CreatePaginationMeta creates pagination metadata
func CreatePaginationMeta(page, limit int, total int64) PaginationMeta {
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

// ValidationErrorResponse creates a validation error response
func ValidationErrorResponse(errors map[string]string) APIResponse {
	return APIResponse{
		Success:   false,
		Message:   "Validation failed",
		Error:     errors,
		Timestamp: time.Now(),
	}
}

// NotFoundResponse creates a not found error response
func NotFoundResponse(resource string) APIResponse {
	return APIResponse{
		Success:   false,
		Message:   resource + " not found",
		Timestamp: time.Now(),
	}
}

// UnauthorizedResponse creates an unauthorized error response
func UnauthorizedResponse(message string) APIResponse {
	if message == "" {
		message = "Unauthorized access"
	}
	return APIResponse{
		Success:   false,
		Message:   message,
		Timestamp: time.Now(),
	}
}

// ForbiddenResponse creates a forbidden error response
func ForbiddenResponse(message string) APIResponse {
	if message == "" {
		message = "Insufficient permissions"
	}
	return APIResponse{
		Success:   false,
		Message:   message,
		Timestamp: time.Now(),
	}
}

// ConflictResponse creates a conflict error response
func ConflictResponse(message string) APIResponse {
	return APIResponse{
		Success:   false,
		Message:   message,
		Timestamp: time.Now(),
	}
}

// InternalServerErrorResponse creates an internal server error response
func InternalServerErrorResponse(message string) APIResponse {
	if message == "" {
		message = "Internal server error"
	}
	return APIResponse{
		Success:   false,
		Message:   message,
		Timestamp: time.Now(),
	}
}
