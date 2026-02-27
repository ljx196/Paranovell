package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

var authService = service.NewAuthService()
var emailService *service.EmailService

// InitEmailService 初始化邮件服务
func InitEmailService(cfg *config.EmailConfig, redis *redis.Client) {
	if redis != nil {
		emailService = service.NewEmailService(cfg, redis)
		log.Println("Email service initialized")
	} else {
		log.Println("Email service disabled (Redis not available)")
	}
}

// Register 用户注册
func Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := utils.ValidatePasswordComplexity(req.Password); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := authService.Register(&req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailExists):
			utils.Conflict(c, utils.CodeEmailExists, "邮箱已被注册")
		case errors.Is(err, service.ErrInvalidInviteCode):
			utils.BadRequest(c, "无效的邀请码")
		default:
			utils.InternalError(c, "注册失败")
		}
		return
	}

	// 发送验证邮件（使用独立 context，不依赖请求生命周期）
	if emailService != nil {
		go func(userID uint, email string) {
			if err := emailService.SendVerificationEmail(context.Background(), userID, email); err != nil {
				log.Printf("Failed to send verification email to %s: %v", email, err)
			}
		}(user.ID, user.Email)
	}

	// 生成 Token
	tokenPair, err := utils.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		utils.InternalError(c, "生成 Token 失败")
		return
	}

	utils.Success(c, dto.LoginResponse{
		User:         service.ToUserResponse(user),
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
	})
}

// Login 用户登录
func Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, tokenPair, err := authService.Login(&req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			utils.Unauthorized(c, "邮箱或密码错误")
		case errors.Is(err, service.ErrEmailNotVerified):
			utils.Forbidden(c, "请先验证邮箱后再登录")
		case errors.Is(err, service.ErrAccountDisabled):
			utils.Forbidden(c, "账户已被禁用")
		default:
			utils.InternalError(c, "登录失败")
		}
		return
	}

	utils.Success(c, dto.LoginResponse{
		User:         service.ToUserResponse(user),
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
	})
}

// Logout 用户登出
func Logout(c *gin.Context) {
	token := extractToken(c)
	if token != "" {
		blacklistToken(token)
	}
	utils.SuccessMessage(c, "登出成功")
}

// extractToken 从请求头中提取 Bearer Token
func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && parts[0] == "Bearer" {
		return parts[1]
	}
	return ""
}

// blacklistToken 将 Token 加入 Redis 黑名单，TTL 设为 Token 剩余有效期
func blacklistToken(token string) {
	rdb := database.GetRedis()
	if rdb == nil {
		return
	}
	// 解析 Token 获取过期时间，用作 Redis TTL
	claims, err := utils.ValidateToken(token)
	if err != nil {
		return
	}
	ttl := time.Until(claims.ExpiresAt.Time)
	if ttl <= 0 {
		return // 已过期，无需加黑名单
	}
	h := sha256.Sum256([]byte(token))
	key := "token_blacklist:" + hex.EncodeToString(h[:])
	rdb.Set(context.Background(), key, "1", ttl)
}

// RefreshToken 刷新 Token
func RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	claims, err := utils.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		utils.Unauthorized(c, "无效的 Refresh Token")
		return
	}

	// 生成新的 Token
	tokenPair, err := utils.GenerateTokenPair(claims.UserID, claims.Email, claims.Role)
	if err != nil {
		utils.InternalError(c, "生成 Token 失败")
		return
	}

	utils.Success(c, gin.H{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
		"expires_in":    tokenPair.ExpiresIn,
	})
}

// ForgotPassword 忘记密码
func ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 查找用户
	user, err := authService.FindUserByEmail(req.Email)
	if err == nil && user != nil && emailService != nil {
		// 异步发送密码重置邮件（使用独立 context）
		go func(userID uint, email string) {
			if err := emailService.SendPasswordResetEmail(context.Background(), userID, email); err != nil {
				log.Printf("Failed to send password reset email to %s: %v", email, err)
			}
		}(user.ID, user.Email)
	}

	// 无论用户是否存在，都返回相同的响应（安全考虑）
	utils.SuccessMessage(c, "如果该邮箱已注册，您将收到密码重置邮件")
}

// ResetPassword 重置密码
func ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := utils.ValidatePasswordComplexity(req.Password); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if emailService == nil {
		utils.InternalError(c, "邮件服务不可用")
		return
	}

	// 验证 Token
	userID, err := emailService.VerifyPasswordResetToken(c.Request.Context(), req.Token)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 重置密码
	if err := authService.ResetPassword(userID, req.Password); err != nil {
		utils.InternalError(c, "密码重置失败")
		return
	}

	// 删除 Token
	emailService.DeletePasswordResetToken(c.Request.Context(), req.Token)

	utils.SuccessMessage(c, "密码重置成功")
}

// VerifyEmail 邮箱验证
func VerifyEmail(c *gin.Context) {
	var req dto.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if emailService == nil {
		utils.InternalError(c, "邮件服务不可用")
		return
	}

	// 验证 Token
	userID, err := emailService.VerifyEmailToken(c.Request.Context(), req.Token)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 更新用户邮箱验证状态
	if err := authService.VerifyUserEmail(userID); err != nil {
		utils.InternalError(c, "验证失败")
		return
	}

	utils.SuccessMessage(c, "邮箱验证成功")
}
