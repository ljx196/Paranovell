package handler

import (
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminAuditService *service.AdminAuditService

func InitAdminAuditService(s *service.AdminAuditService) {
	adminAuditService = s
}

func GetAdminAuditService() *service.AdminAuditService {
	return adminAuditService
}

// AdminGetAuditLogs GET /api/admin/audit-logs
func AdminGetAuditLogs(c *gin.Context) {
	var req dto.AdminAuditLogListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminAuditService.List(&req)
	if err != nil {
		utils.InternalError(c, "获取操作日志失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetAuditLogDetail GET /api/admin/audit-logs/:id
func AdminGetAuditLogDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的日志 ID")
		return
	}

	result, err := adminAuditService.GetDetail(uint(id))
	if err != nil {
		utils.NotFound(c, "日志不存在")
		return
	}
	utils.Success(c, result)
}
