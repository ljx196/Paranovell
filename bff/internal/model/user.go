package model

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Email         string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash  string         `gorm:"size:255;not null" json:"-"`
	Nickname      string         `gorm:"size:50" json:"nickname"`
	AvatarURL     string         `gorm:"size:500" json:"avatar_url"`
	EmailVerified bool           `gorm:"default:false" json:"email_verified"`
	InviteCode    string         `gorm:"uniqueIndex;size:20;not null" json:"invite_code"`
	Status        int8           `gorm:"default:1" json:"status"` // 1: active, 0: disabled, -1: deleted
	Role          string         `gorm:"size:20;not null;default:'user'" json:"role"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "bff_schema.users"
}

// UserPreference represents user preferences
type UserPreference struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	UserID              uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	Theme               string    `gorm:"size:20;default:'system'" json:"theme"`
	Language            string    `gorm:"size:10;default:'zh-CN'" json:"language"`
	NotificationEnabled bool      `gorm:"default:true" json:"notification_enabled"`
	SettingsJSON        string    `gorm:"type:jsonb;default:'{}'" json:"settings_json"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func (UserPreference) TableName() string {
	return "bff_schema.user_preferences"
}

// Referral represents a referral relationship
type Referral struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ReferrerID uint      `gorm:"not null;index" json:"referrer_id"`
	RefereeID  uint      `gorm:"uniqueIndex;not null" json:"referee_id"`
	CreatedAt  time.Time `json:"created_at"`
}

func (Referral) TableName() string {
	return "bff_schema.referrals"
}

// 角色常量
const (
	RoleUser       = "user"
	RoleAdmin      = "admin"
	RoleSuperAdmin = "super_admin"
)

// IsAdmin 判断是否为管理员
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin || u.Role == RoleSuperAdmin
}
