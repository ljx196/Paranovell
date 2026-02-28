package model

import "gorm.io/gorm"

// QuickReply represents a preset quick reply option for chat
type QuickReply struct {
	gorm.Model
	Content   string `gorm:"type:varchar(200);not null"`
	SortOrder int    `gorm:"default:0"`
	IsActive  bool   `gorm:"default:true;index"`
}

func (QuickReply) TableName() string {
	return "bff_schema.quick_replies"
}
