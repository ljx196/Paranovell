package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/smtp"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/go-redis/redis/v8"
)

const (
	// Token 有效期
	EmailVerifyTokenTTL    = 24 * time.Hour // 邮箱验证 Token 有效期
	PasswordResetTokenTTL  = 1 * time.Hour  // 密码重置 Token 有效期

	// Redis Key 前缀
	EmailVerifyKeyPrefix   = "email_verify:"
	PasswordResetKeyPrefix = "password_reset:"
)

// EmailService 邮件服务
type EmailService struct {
	config *config.EmailConfig
	redis  *redis.Client
}

// NewEmailService 创建邮件服务
func NewEmailService(cfg *config.EmailConfig, redis *redis.Client) *EmailService {
	return &EmailService{
		config: cfg,
		redis:  redis,
	}
}

// GenerateToken 生成随机 Token
func (s *EmailService) GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SendVerificationEmail 发送邮箱验证邮件
func (s *EmailService) SendVerificationEmail(ctx context.Context, userID uint, email string) error {
	// 生成验证 Token
	token, err := s.GenerateToken()
	if err != nil {
		return fmt.Errorf("生成 Token 失败: %w", err)
	}

	// 保存 Token 到 Redis
	key := EmailVerifyKeyPrefix + token
	err = s.redis.Set(ctx, key, userID, EmailVerifyTokenTTL).Err()
	if err != nil {
		return fmt.Errorf("保存 Token 失败: %w", err)
	}

	// 构建验证链接
	// TODO: 从配置中读取前端 URL
	verifyURL := fmt.Sprintf("http://localhost:8081/verify-email?token=%s", token)

	// 邮件内容
	subject := "验证您的 GenNovel 账户"
	body := fmt.Sprintf(`
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
	<h2>欢迎加入 GenNovel！</h2>
	<p>感谢您注册 GenNovel。请点击下面的链接验证您的邮箱地址：</p>
	<p><a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #D4836A; color: white; text-decoration: none; border-radius: 8px;">验证邮箱</a></p>
	<p>或者复制以下链接到浏览器：</p>
	<p style="color: #666;">%s</p>
	<p>此链接将在 24 小时后失效。</p>
	<p>如果您没有注册 GenNovel 账户，请忽略此邮件。</p>
	<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
	<p style="color: #999; font-size: 12px;">GenNovel - 您的 AI 小说创作助手</p>
</body>
</html>
`, verifyURL, verifyURL)

	// 发送邮件
	return s.sendEmail(email, subject, body)
}

// VerifyEmailToken 验证邮箱 Token
func (s *EmailService) VerifyEmailToken(ctx context.Context, token string) (uint, error) {
	key := EmailVerifyKeyPrefix + token

	// 获取用户 ID
	userIDStr, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return 0, fmt.Errorf("验证链接无效或已过期")
	}
	if err != nil {
		return 0, fmt.Errorf("验证失败: %w", err)
	}

	var userID uint
	_, err = fmt.Sscanf(userIDStr, "%d", &userID)
	if err != nil {
		return 0, fmt.Errorf("无效的用户 ID")
	}

	// 删除 Token（一次性使用）
	s.redis.Del(ctx, key)

	return userID, nil
}

// SendPasswordResetEmail 发送密码重置邮件
func (s *EmailService) SendPasswordResetEmail(ctx context.Context, userID uint, email string) error {
	// 生成重置 Token
	token, err := s.GenerateToken()
	if err != nil {
		return fmt.Errorf("生成 Token 失败: %w", err)
	}

	// 保存 Token 到 Redis
	key := PasswordResetKeyPrefix + token
	err = s.redis.Set(ctx, key, userID, PasswordResetTokenTTL).Err()
	if err != nil {
		return fmt.Errorf("保存 Token 失败: %w", err)
	}

	// 构建重置链接
	resetURL := fmt.Sprintf("http://localhost:8081/reset-password?token=%s", token)

	// 邮件内容
	subject := "重置您的 GenNovel 密码"
	body := fmt.Sprintf(`
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
	<h2>密码重置请求</h2>
	<p>我们收到了您的密码重置请求。请点击下面的链接重置密码：</p>
	<p><a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #D4836A; color: white; text-decoration: none; border-radius: 8px;">重置密码</a></p>
	<p>或者复制以下链接到浏览器：</p>
	<p style="color: #666;">%s</p>
	<p>此链接将在 1 小时后失效。</p>
	<p>如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。</p>
	<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
	<p style="color: #999; font-size: 12px;">GenNovel - 您的 AI 小说创作助手</p>
</body>
</html>
`, resetURL, resetURL)

	// 发送邮件
	return s.sendEmail(email, subject, body)
}

// VerifyPasswordResetToken 验证密码重置 Token
func (s *EmailService) VerifyPasswordResetToken(ctx context.Context, token string) (uint, error) {
	key := PasswordResetKeyPrefix + token

	// 获取用户 ID
	userIDStr, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return 0, fmt.Errorf("重置链接无效或已过期")
	}
	if err != nil {
		return 0, fmt.Errorf("验证失败: %w", err)
	}

	var userID uint
	_, err = fmt.Sscanf(userIDStr, "%d", &userID)
	if err != nil {
		return 0, fmt.Errorf("无效的用户 ID")
	}

	return userID, nil
}

// DeletePasswordResetToken 删除密码重置 Token
func (s *EmailService) DeletePasswordResetToken(ctx context.Context, token string) {
	key := PasswordResetKeyPrefix + token
	s.redis.Del(ctx, key)
}

// sendEmail 发送邮件
func (s *EmailService) sendEmail(to, subject, body string) error {
	// 检查配置
	if s.config.SMTPHost == "" {
		// 开发模式：仅打印邮件内容
		fmt.Printf("\n========== 邮件发送（开发模式）==========\n")
		fmt.Printf("收件人: %s\n", to)
		fmt.Printf("主题: %s\n", subject)
		fmt.Printf("内容: %s\n", body)
		fmt.Printf("==========================================\n\n")
		return nil
	}

	// 构建邮件头
	from := s.config.FromAddress
	if s.config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromAddress)
	}

	headers := map[string]string{
		"From":         from,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=UTF-8",
	}

	var message string
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// SMTP 认证
	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.SMTPHost)

	// 发送邮件
	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)
	err := smtp.SendMail(addr, auth, s.config.FromAddress, []string{to}, []byte(message))
	if err != nil {
		return fmt.Errorf("发送邮件失败: %w", err)
	}

	return nil
}

// IsConfigured 检查邮件服务是否已配置
func (s *EmailService) IsConfigured() bool {
	return s.config.SMTPHost != ""
}
