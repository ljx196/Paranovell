package service

import (
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

// UpdateProfile 更新用户资料
func (s *UserService) UpdateProfile(userID uint, req *dto.UpdateProfileRequest) (*model.User, error) {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, ErrUserNotFound
	}

	updates := make(map[string]interface{})
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}

	if len(updates) > 0 {
		if err := db.Model(&user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	// 重新加载用户数据
	db.First(&user, userID)
	return &user, nil
}

// DeleteAccount 注销账户
func (s *UserService) DeleteAccount(userID uint) error {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return ErrUserNotFound
	}

	// 软删除：将状态设为 -1
	return db.Model(&user).Update("status", -1).Error
}

// GetReferralInfo 获取推荐信息
func (s *UserService) GetReferralInfo(userID uint) (*dto.ReferralResponse, error) {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, ErrUserNotFound
	}

	// 统计推荐人数
	var count int64
	db.Model(&model.Referral{}).Where("referrer_id = ?", userID).Count(&count)

	return &dto.ReferralResponse{
		InviteCode:    user.InviteCode,
		ReferralCount: int(count),
	}, nil
}

// GetPreferences 获取用户偏好
func (s *UserService) GetPreferences(userID uint) (*model.UserPreference, error) {
	db := database.GetDB()

	var pref model.UserPreference
	if err := db.Where("user_id = ?", userID).First(&pref).Error; err != nil {
		return nil, err
	}

	return &pref, nil
}

// UpdatePreferences 更新用户偏好
func (s *UserService) UpdatePreferences(userID uint, req *dto.UpdatePreferenceRequest) (*model.UserPreference, error) {
	db := database.GetDB()

	var pref model.UserPreference
	if err := db.Where("user_id = ?", userID).First(&pref).Error; err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Theme != "" {
		updates["theme"] = req.Theme
	}
	if req.Language != "" {
		updates["language"] = req.Language
	}
	if req.NotificationEnabled != nil {
		updates["notification_enabled"] = *req.NotificationEnabled
	}

	if len(updates) > 0 {
		if err := db.Model(&pref).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	db.Where("user_id = ?", userID).First(&pref)
	return &pref, nil
}
