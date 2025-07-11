package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageAttachment struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	MessageID    uuid.UUID `json:"message_id" gorm:"type:uuid;not null"`
	FileName     string    `json:"file_name" gorm:"size:255;not null"`
	FileSize     int64     `json:"file_size" gorm:"not null"`
	FileType     string    `json:"file_type" gorm:"size:100;not null"`
	FileURL      string    `json:"file_url" gorm:"type:text;not null"`
	ThumbnailURL *string   `json:"thumbnail_url" gorm:"type:text"`
	CreatedAt    time.Time `json:"created_at"`

	// Relationships
	Message *Message `json:"message,omitempty" gorm:"foreignKey:MessageID"`
}

// TableName returns the table name for MessageAttachment model
func (MessageAttachment) TableName() string {
	return "message_attachments"
}

// BeforeCreate hook to set ID if not provided
func (ma *MessageAttachment) BeforeCreate(tx *gorm.DB) error {
	if ma.ID == uuid.Nil {
		ma.ID = uuid.New()
	}
	return nil
}

// IsImage checks if attachment is an image
func (ma *MessageAttachment) IsImage() bool {
	switch ma.FileType {
	case "image/jpeg", "image/png", "image/gif", "image/webp":
		return true
	}
	return false
}

// IsVideo checks if attachment is a video
func (ma *MessageAttachment) IsVideo() bool {
	switch ma.FileType {
	case "video/mp4", "video/webm", "video/ogg":
		return true
	}
	return false
}

// IsAudio checks if attachment is audio
func (ma *MessageAttachment) IsAudio() bool {
	switch ma.FileType {
	case "audio/mp3", "audio/wav", "audio/ogg":
		return true
	}
	return false
}

// HasThumbnail checks if attachment has thumbnail
func (ma *MessageAttachment) HasThumbnail() bool {
	return ma.ThumbnailURL != nil && *ma.ThumbnailURL != ""
}
