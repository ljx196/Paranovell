package service

import (
	"errors"
	"os"
	"strings"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"github.com/gennovelweb/bff/internal/utils"
	"gorm.io/gorm"
)

var (
	ErrEmailExists         = errors.New("email already exists")
	ErrInvalidInviteCode   = errors.New("invalid invite code")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrEmailNotVerified    = errors.New("email not verified")
	ErrAccountDisabled     = errors.New("account is disabled")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidOldPassword  = errors.New("invalid old password")
)

type AuthService struct{}

// balanceSvc 由外部注入，用于注册时初始化余额
var balanceSvc *BalanceService

// SetBalanceService 注入 BalanceService（在 main.go 中调用）
func SetBalanceService(bs *BalanceService) {
	balanceSvc = bs
}

func NewAuthService() *AuthService {
	return &AuthService{}
}

// Register 用户注册
func (s *AuthService) Register(req *dto.RegisterRequest) (*model.User, error) {
	db := database.GetDB()

	// 检查邮箱是否已存在
	var existingUser model.User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, ErrEmailExists
	}

	// 验证邀请码（如果提供）
	var referrerID uint
	if req.InviteCode != "" {
		var referrer model.User
		if err := db.Where("invite_code = ?", req.InviteCode).First(&referrer).Error; err != nil {
			return nil, ErrInvalidInviteCode
		}
		referrerID = referrer.ID
	}

	// 密码哈希
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 创建用户（邀请码冲突时自动重试）
	user := &model.User{
		Email:         req.Email,
		PasswordHash:  passwordHash,
		Nickname:      req.Nickname,
		InviteCode:    utils.GenerateInviteCode(),
		EmailVerified: false,
		Status:        1,
	}

	const maxRetries = 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			user.ID = 0 // reset for retry
			user.InviteCode = utils.GenerateInviteCode()
		}
		err = db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(user).Error; err != nil {
				return err
			}

			// 创建用户偏好设置
			pref := &model.UserPreference{
				UserID:              user.ID,
				Theme:               "system",
				Language:            "zh-CN",
				NotificationEnabled: true,
				SettingsJSON:        "{}",
			}
			if err := tx.Create(pref).Error; err != nil {
				return err
			}

			// 如果有推荐人，创建推荐关系
			if referrerID > 0 {
				referral := &model.Referral{
					ReferrerID: referrerID,
					RefereeID:  user.ID,
				}
				if err := tx.Create(referral).Error; err != nil {
					return err
				}
			}

			// 创建余额记录并赠送初始点数
			if balanceSvc != nil {
				if err := balanceSvc.InitBalanceForNewUser(tx, user.ID); err != nil {
					return err
				}
			}

			// 发送欢迎系统消息
			welcomeMsg := &model.SystemMessage{
				UserID:  user.ID,
				Title:   "欢迎加入 GenNovelWeb",
				Content: "感谢您注册 GenNovelWeb！请验证您的邮箱以获得完整功能。",
				MsgType: "account",
				IsRead:  false,
			}
			return tx.Create(welcomeMsg).Error
		})
		if err == nil {
			break
		}
		// Only retry on invite code unique constraint violation
		if attempt < maxRetries-1 && strings.Contains(err.Error(), "invite_code") {
			continue
		}
		return nil, err
	}

	return user, nil
}

// Login 用户登录
func (s *AuthService) Login(req *dto.LoginRequest) (*model.User, *utils.TokenPair, error) {
	db := database.GetDB()

	var user model.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	// 检查账户状态
	if user.Status == 0 {
		return nil, nil, ErrAccountDisabled
	}
	if user.Status == -1 {
		return nil, nil, ErrInvalidCredentials
	}

	// 验证密码
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, nil, ErrInvalidCredentials
	}

	// 检查邮箱是否已验证（开发环境跳过）
	if !user.EmailVerified {
		env := os.Getenv("ENV")
		if env == "" {
			env = "development"
		}
		if env != "development" {
			return nil, nil, ErrEmailNotVerified
		}
	}

	// 生成 Token
	tokenPair, err := utils.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokenPair, nil
}

// GetUserByID 根据 ID 获取用户
func (s *AuthService) GetUserByID(userID uint) (*model.User, error) {
	db := database.GetDB()
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, ErrUserNotFound
	}
	return &user, nil
}

// ChangePassword 修改密码
func (s *AuthService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return ErrUserNotFound
	}

	// 验证旧密码
	if !utils.CheckPassword(oldPassword, user.PasswordHash) {
		return ErrInvalidOldPassword
	}

	// 哈希新密码
	newHash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// 更新密码
	return db.Model(&user).Update("password_hash", newHash).Error
}

// FindUserByEmail 根据邮箱查找用户
func (s *AuthService) FindUserByEmail(email string) (*model.User, error) {
	db := database.GetDB()
	var user model.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, ErrUserNotFound
	}
	return &user, nil
}

// VerifyUserEmail 验证用户邮箱
func (s *AuthService) VerifyUserEmail(userID uint) error {
	db := database.GetDB()
	return db.Model(&model.User{}).Where("id = ?", userID).Update("email_verified", true).Error
}

// ResetPassword 重置用户密码
func (s *AuthService) ResetPassword(userID uint, newPassword string) error {
	db := database.GetDB()

	// 哈希新密码
	newHash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// 更新密码
	return db.Model(&model.User{}).Where("id = ?", userID).Update("password_hash", newHash).Error
}

// ToUserResponse 转换为用户响应 DTO
func ToUserResponse(user *model.User) dto.UserResponse {
	return dto.UserResponse{
		ID:            user.ID,
		Email:         user.Email,
		Nickname:      user.Nickname,
		AvatarURL:     user.AvatarURL,
		Role:          user.Role,
		EmailVerified: user.EmailVerified,
		InviteCode:    user.InviteCode,
		CreatedAt:     user.CreatedAt,
	}
}
