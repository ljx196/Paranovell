package handler

import (
	"errors"
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminUserService *service.AdminUserService

func InitAdminUserService(bs *service.BalanceService, as *service.AdminAuditService) {
	adminUserService = service.NewAdminUserService(bs, as)
}

// GetAdminUserService 获取管理用户服务实例
func GetAdminUserService() *service.AdminUserService {
	return adminUserService
}

// AdminGetUsers GET /api/admin/users
func AdminGetUsers(c *gin.Context) {
	var req dto.AdminUserListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminUserService.List(&req)
	if err != nil {
		utils.InternalError(c, "获取用户列表失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetUserDetail GET /api/admin/users/:id
func AdminGetUserDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户 ID")
		return
	}

	result, err := adminUserService.GetDetail(uint(id))
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "获取用户详情失败")
		return
	}
	utils.Success(c, result)
}

// AdminUpdateUserStatus PUT /api/admin/users/:id/status
func AdminUpdateUserStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	var req dto.UpdateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	err = adminUserService.UpdateStatus(adminID, uint(id), &req, ip)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "操作失败")
		return
	}
	utils.SuccessMessage(c, "操作成功")
}

// AdminAdjustBalance POST /api/admin/users/:id/adjust-balance
func AdminAdjustBalance(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	var req dto.AdjustBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	err = adminUserService.AdjustBalance(adminID, uint(id), &req, ip)
	if err != nil {
		if errors.Is(err, service.ErrInsufficientBalance) {
			utils.BadRequest(c, "扣除金额超过当前余额")
			return
		}
		utils.InternalError(c, "调账失败")
		return
	}
	utils.SuccessMessage(c, "调账成功")
}

// AdminResetPassword POST /api/admin/users/:id/reset-password
func AdminResetPassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	var req dto.AdminResetPasswordRequest
	c.ShouldBindJSON(&req)

	newPassword, err := adminUserService.ResetPassword(adminID, uint(id), req.SendEmail, ip)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "重置密码失败")
		return
	}

	utils.Success(c, gin.H{
		"message":      "密码已重置",
		"new_password": newPassword,
	})
}
