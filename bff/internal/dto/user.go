package dto

import "time"

// UserResponse 用户信息响应
type UserResponse struct {
	ID            uint      `json:"id"`
	Email         string    `json:"email"`
	Nickname      string    `json:"nickname"`
	AvatarURL     string    `json:"avatar_url"`
	Role          string    `json:"role"`
	EmailVerified bool      `json:"email_verified"`
	InviteCode    string    `json:"invite_code"`
	CreatedAt     time.Time `json:"created_at"`
}

// UpdateProfileRequest 更新资料请求
type UpdateProfileRequest struct {
	Nickname  string `json:"nickname" binding:"omitempty,max=50"`
	AvatarURL string `json:"avatar_url" binding:"omitempty,url,max=500"`
}

// UserPreferenceResponse 用户偏好响应
type UserPreferenceResponse struct {
	Theme               string `json:"theme"`
	Language            string `json:"language"`
	NotificationEnabled bool   `json:"notification_enabled"`
}

// UpdatePreferenceRequest 更新偏好请求
type UpdatePreferenceRequest struct {
	Theme               string `json:"theme" binding:"omitempty,oneof=light dark system"`
	Language            string `json:"language" binding:"omitempty,max=10"`
	NotificationEnabled *bool  `json:"notification_enabled"`
}

// ReferralResponse 推荐信息响应
type ReferralResponse struct {
	InviteCode    string `json:"invite_code"`
	ReferralCount int    `json:"referral_count"`
}
