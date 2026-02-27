package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// Auth JWT 认证中间件
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "请先登录")
			c.Abort()
			return
		}

		// 检查 Bearer token 格式
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.Unauthorized(c, "无效的认证格式")
			c.Abort()
			return
		}

		token := parts[1]

		// 验证 JWT Token
		claims, err := utils.ValidateToken(token)
		if err != nil {
			if err == utils.ErrExpiredToken {
				utils.Unauthorized(c, "Token 已过期")
			} else {
				utils.Unauthorized(c, "无效的 Token")
			}
			c.Abort()
			return
		}

		// 检查是否为 access token
		if claims.Subject != "" && claims.Subject != "access" {
			utils.Unauthorized(c, "无效的 Token 类型")
			c.Abort()
			return
		}

		// 检查 Token 是否在黑名单中
		if isTokenBlacklisted(token) {
			utils.Unauthorized(c, "Token 已失效")
			c.Abort()
			return
		}

		// 设置用户信息到上下文
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// isTokenBlacklisted 检查 Token 是否在黑名单中
func isTokenBlacklisted(token string) bool {
	rdb := database.GetRedis()
	if rdb == nil {
		return false // Redis 不可用时不阻塞
	}
	key := "token_blacklist:" + hashToken(token)
	exists, err := rdb.Exists(context.Background(), key).Result()
	return err == nil && exists > 0
}

// hashToken 对 Token 做 SHA256 哈希，避免 Redis key 过长
func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
