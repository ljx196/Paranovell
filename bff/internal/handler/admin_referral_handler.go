package handler

import (
	"errors"
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminReferralService *service.AdminReferralService

// InitAdminReferralService 初始化邀请管理服务
func InitAdminReferralService(rs *service.AdminReferralService) {
	adminReferralService = rs
}

// AdminGetReferralStats GET /api/admin/referrals/stats
func AdminGetReferralStats(c *gin.Context) {
	result, err := adminReferralService.GetStats()
	if err != nil {
		utils.InternalError(c, "获取邀请统计失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetReferrals GET /api/admin/referrals
func AdminGetReferrals(c *gin.Context) {
	var req dto.AdminReferralListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminReferralService.ListReferrals(&req)
	if err != nil {
		utils.InternalError(c, "获取邀请关系列表失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetReferrerDetail GET /api/admin/referrals/:user_id
func AdminGetReferrerDetail(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户 ID")
		return
	}

	var req dto.AdminReferrerDetailRequest
	c.ShouldBindQuery(&req)

	result, err := adminReferralService.GetReferrerDetail(uint(userID), &req)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "获取邀请人详情失败")
		return
	}
	utils.Success(c, result)
}
