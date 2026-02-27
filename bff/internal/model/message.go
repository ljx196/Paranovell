package model

import (
	"time"
)

// SystemMessage represents a system notification message
type SystemMessage struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"user_id"`
	Title     string     `gorm:"size:100;not null" json:"title"`
	Content   string     `gorm:"type:text;not null" json:"content"`
	MsgType   string     `gorm:"size:20;not null" json:"msg_type"` // account, notice, usage
	IsRead    bool       `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time  `json:"created_at"`
	ReadAt    *time.Time `json:"read_at"`
}

func (SystemMessage) TableName() string {
	return "bff_schema.system_messages"
}

// TokenUsage represents token usage record
type TokenUsage struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	UserID         uint      `gorm:"not null;index" json:"user_id"`
	ConversationID uint      `gorm:"not null;index" json:"conversation_id"`
	MessageID      uint      `gorm:"not null" json:"message_id"`
	InputTokens    int       `gorm:"not null" json:"input_tokens"`
	OutputTokens   int       `gorm:"not null" json:"output_tokens"`
	TotalTokens    int       `gorm:"not null" json:"total_tokens"`
	Model          string    `gorm:"size:50" json:"model"`
	PointsConsumed int64     `gorm:"default:0" json:"points_consumed"`
	CreatedAt      time.Time `json:"created_at"`
}

func (TokenUsage) TableName() string {
	return "bff_schema.token_usage"
}
