package handler

import (
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var usageService = service.NewUsageService()

// GetUsageSummary 获取用量汇总
func GetUsageSummary(c *gin.Context) {
	userID := c.GetUint("userID")

	summary, err := usageService.GetUsageSummary(userID)
	if err != nil {
		utils.InternalError(c, "获取用量汇总失败")
		return
	}

	utils.Success(c, summary)
}

// GetDailyUsage 获取每日用量
func GetDailyUsage(c *gin.Context) {
	userID := c.GetUint("userID")

	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 365 {
			days = parsed
		}
	}

	daily, err := usageService.GetDailyUsage(userID, days)
	if err != nil {
		utils.InternalError(c, "获取每日用量失败")
		return
	}

	utils.Success(c, gin.H{
		"daily": daily,
		"days":  days,
	})
}

// GetUsageDetail 获取用量明细
func GetUsageDetail(c *gin.Context) {
	userID := c.GetUint("userID")

	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 365 {
			days = parsed
		}
	}

	detail, err := usageService.GetUsageDetail(userID, days)
	if err != nil {
		utils.InternalError(c, "获取用量明细失败")
		return
	}

	utils.Success(c, detail)
}

// GetConversationRanking GET /api/v1/usage/conversations
func GetConversationRanking(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.ConversationRankingRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := usageService.GetConversationRanking(userID, &req)
	if err != nil {
		utils.InternalError(c, "获取会话消费排行失败")
		return
	}

	utils.Success(c, result)
}

// GetDailyUsageExtended GET /api/v1/usage/daily-extended
func GetDailyUsageExtended(c *gin.Context) {
	userID := c.GetUint("userID")

	days := 7
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 365 {
			days = parsed
		}
	}

	daily, err := usageService.GetDailyUsageExtended(userID, days)
	if err != nil {
		utils.InternalError(c, "获取每日用量失败")
		return
	}

	utils.Success(c, gin.H{
		"daily": daily,
		"days":  days,
	})
}
