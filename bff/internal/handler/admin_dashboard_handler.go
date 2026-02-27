package handler

import (
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminDashboardService *service.AdminDashboardService

func InitAdminDashboardService(s *service.AdminDashboardService) {
	adminDashboardService = s
}

// AdminGetDashboardStats GET /api/admin/dashboard/stats
func AdminGetDashboardStats(c *gin.Context) {
	result, err := adminDashboardService.GetStats()
	if err != nil {
		utils.InternalError(c, "获取统计数据失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetDashboardTrends GET /api/admin/dashboard/trends
func AdminGetDashboardTrends(c *gin.Context) {
	var req dto.TrendRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误: type 和 days 为必填项")
		return
	}

	result, err := adminDashboardService.GetTrends(&req)
	if err != nil {
		utils.InternalError(c, "获取趋势数据失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetRecentLogs GET /api/admin/dashboard/recent-logs
func AdminGetRecentLogs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	result, err := adminDashboardService.GetRecentLogs(limit)
	if err != nil {
		utils.InternalError(c, "获取最近操作失败")
		return
	}
	utils.Success(c, result)
}
