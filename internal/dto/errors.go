package dto

import (
	"errors"
	"fmt"
)

// Authentication and User errors
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserExists         = errors.New("user already exists")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token has expired")
	ErrUnauthorized       = errors.New("unauthorized access")
	ErrForbidden          = errors.New("access forbidden")
	ErrInvalidUserID      = errors.New("invalid user ID")
	ErrPasswordTooWeak    = errors.New("password does not meet requirements")
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrPhoneInvalid       = errors.New("invalid phone number format")
)

// Validation errors
var (
	ErrValidationFailed   = errors.New("validation failed")
	ErrRequiredField      = errors.New("required field is missing")
	ErrInvalidFieldFormat = errors.New("field format is invalid")
	ErrFieldTooLong       = errors.New("field exceeds maximum length")
	ErrFieldTooShort      = errors.New("field is below minimum length")
)

// Database errors
var (
	ErrDatabaseConnection = errors.New("database connection failed")
	ErrDatabaseQuery      = errors.New("database query failed")
	ErrRecordNotFound     = errors.New("record not found")
	ErrDuplicateEntry     = errors.New("duplicate entry")
	ErrTransactionFailed  = errors.New("database transaction failed")
)

// Business logic errors
var (
	ErrInsufficientPermissions = errors.New("insufficient permissions")
	ErrResourceNotFound        = errors.New("resource not found")
	ErrResourceUnavailable     = errors.New("resource is unavailable")
	ErrOperationNotAllowed     = errors.New("operation not allowed")
	ErrQuotaExceeded           = errors.New("quota exceeded")
	ErrServiceUnavailable      = errors.New("service temporarily unavailable")
)

// File and upload errors
var (
	ErrFileNotFound    = errors.New("file not found")
	ErrFileTooBig      = errors.New("file size exceeds limit")
	ErrInvalidFileType = errors.New("invalid file type")
	ErrUploadFailed    = errors.New("file upload failed")
	ErrFileCorrupted   = errors.New("file is corrupted")
)

// Rate limiting and security errors
var (
	ErrRateLimitExceeded  = errors.New("rate limit exceeded")
	ErrIPBlocked          = errors.New("IP address is blocked")
	ErrSuspiciousActivity = errors.New("suspicious activity detected")
	ErrAccountLocked      = errors.New("account is locked")
	ErrSessionExpired     = errors.New("session has expired")
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string                 `json:"error"`
	Message string                 `json:"message,omitempty"`
	Code    string                 `json:"code,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// ValidationError represents field validation errors
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Code    string `json:"code"`
}

// ValidationErrorResponse represents validation error response
type ValidationErrorResponse struct {
	Error  string            `json:"error"`
	Errors []ValidationError `json:"validation_errors"`
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NewErrorResponse creates a new error response
func NewErrorResponse(err error, message string) *ErrorResponse {
	return &ErrorResponse{
		Error:   err.Error(),
		Message: message,
	}
}

// NewValidationErrorResponse creates a new validation error response
func NewValidationErrorResponse(errors []ValidationError) *ValidationErrorResponse {
	return &ValidationErrorResponse{
		Error:  "validation_failed",
		Errors: errors,
	}
}

// AddDetail adds details to error response
func (e *ErrorResponse) AddDetail(key string, value interface{}) *ErrorResponse {
	if e.Details == nil {
		e.Details = make(map[string]interface{})
	}
	e.Details[key] = value
	return e
}

// WithCode adds error code to response
func (e *ErrorResponse) WithCode(code string) *ErrorResponse {
	e.Code = code
	return e
}

// Common error response constructors
func NewUnauthorizedError(message string) *ErrorResponse {
	return &ErrorResponse{
		Error:   ErrUnauthorized.Error(),
		Message: message,
		Code:    "UNAUTHORIZED",
	}
}

func NewForbiddenError(message string) *ErrorResponse {
	return &ErrorResponse{
		Error:   ErrForbidden.Error(),
		Message: message,
		Code:    "FORBIDDEN",
	}
}

func NewNotFoundError(resource string) *ErrorResponse {
	return &ErrorResponse{
		Error:   ErrResourceNotFound.Error(),
		Message: resource + " not found",
		Code:    "NOT_FOUND",
	}
}

func NewValidationError(field, message string) ValidationError {
	return ValidationError{
		Field:   field,
		Message: message,
		Code:    "VALIDATION_ERROR",
	}
}

func NewConflictError(message string) *ErrorResponse {
	return &ErrorResponse{
		Error:   ErrDuplicateEntry.Error(),
		Message: message,
		Code:    "CONFLICT",
	}
}

func NewInternalServerError(message string) *ErrorResponse {
	return &ErrorResponse{
		Error:   "internal server error",
		Message: message,
		Code:    "INTERNAL_SERVER_ERROR",
	}
}
