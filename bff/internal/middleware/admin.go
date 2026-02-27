package middleware

import (
	"github.com/gennovelweb/bff/internal/model"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

// Admin 管理员鉴权中间件
// 必须在 Auth() 之后使用，从 Context 中读取 role
func Admin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")

		if role != model.RoleAdmin && role != model.RoleSuperAdmin {
			utils.Forbidden(c, "无管理权限")
			c.Abort()
			return
		}

		// 将 adminID 写入 Context（与 userID 相同，语义更清晰）
		c.Set("adminID", c.GetUint("userID"))
		c.Next()
	}
}
