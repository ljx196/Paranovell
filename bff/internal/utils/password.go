package utils

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

const (
	bcryptCost = 12
)

// HashPassword 对密码进行哈希
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPassword 验证密码
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateInviteCode 生成唯一邀请码
func GenerateInviteCode() string {
	bytes := make([]byte, 6)
	rand.Read(bytes)
	code := base64.URLEncoding.EncodeToString(bytes)
	// 移除特殊字符，只保留字母数字
	code = strings.ReplaceAll(code, "-", "")
	code = strings.ReplaceAll(code, "_", "")
	if len(code) > 8 {
		code = code[:8]
	}
	return strings.ToUpper(code)
}

// ValidatePasswordComplexity 校验密码复杂度：必须同时包含字母和数字
func ValidatePasswordComplexity(password string) error {
	hasLetter := false
	hasDigit := false
	for _, c := range password {
		if unicode.IsLetter(c) {
			hasLetter = true
		}
		if unicode.IsDigit(c) {
			hasDigit = true
		}
	}
	if !hasLetter {
		return errors.New("密码必须包含字母")
	}
	if !hasDigit {
		return errors.New("密码必须包含数字")
	}
	return nil
}

// GenerateRandomToken 生成随机 Token（用于邮箱验证、密码重置等）
func GenerateRandomToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}
