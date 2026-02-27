package model

import "time"

// SensitiveWord 敏感词表
type SensitiveWord struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Word      string    `gorm:"size:100;not null;uniqueIndex" json:"word"`
	Category  string    `gorm:"size:20;not null;default:'other'" json:"category"`
	IsEnabled bool      `gorm:"not null;default:true" json:"is_enabled"`
	CreatedBy uint      `gorm:"not null" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (SensitiveWord) TableName() string {
	return "bff_schema.sensitive_words"
}

// ContentReview 内容审查记录表
type ContentReview struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	ConversationID string     `gorm:"size:100;not null;index" json:"conversation_id"`
	UserID         uint       `gorm:"not null;index" json:"user_id"`
	Status         string     `gorm:"size:20;not null;default:'pending'" json:"status"`
	FlagType       string     `gorm:"size:10;not null" json:"flag_type"`
	FlagReason     string     `gorm:"type:text" json:"flag_reason"`
	ReviewerID     *uint      `json:"reviewer_id"`
	ReviewedAt     *time.Time `json:"reviewed_at"`
	ActionTaken    string     `gorm:"size:30;default:'none'" json:"action_taken"`
	CreatedAt      time.Time  `gorm:"index" json:"created_at"`
}

func (ContentReview) TableName() string {
	return "bff_schema.content_reviews"
}

// 敏感词类别常量
const (
	SensitiveCategoryViolence = "violence"
	SensitiveCategoryPorn     = "porn"
	SensitiveCategoryPolitics = "politics"
	SensitiveCategoryAd       = "ad"
	SensitiveCategoryOther    = "other"
)

// 审查状态常量
const (
	ReviewStatusPending   = "pending"
	ReviewStatusApproved  = "approved"
	ReviewStatusViolated  = "violated"
	ReviewStatusDismissed = "dismissed"
)

// 标记类型常量
const (
	FlagTypeManual = "manual"
	FlagTypeAuto   = "auto"
)

// 处理动作常量
const (
	ActionNone               = "none"
	ActionDeleteConversation = "delete_conversation"
	ActionBanUser            = "ban_user"
)
