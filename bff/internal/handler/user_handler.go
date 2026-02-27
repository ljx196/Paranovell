package handler

import (
	"errors"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var userService = service.NewUserService()

// GetProfile 获取个人资料
func GetProfile(c *gin.Context) {
	userID := c.GetUint("userID")

	user, err := authService.GetUserByID(userID)
	if err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	utils.Success(c, service.ToUserResponse(user))
}

// UpdateProfile 更新个人资料
func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	user, err := userService.UpdateProfile(userID, &req)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "更新失败")
		return
	}

	utils.Success(c, service.ToUserResponse(user))
}

// ChangePassword 修改密码
func ChangePassword(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := utils.ValidatePasswordComplexity(req.NewPassword); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	err := authService.ChangePassword(userID, req.OldPassword, req.NewPassword)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserNotFound):
			utils.NotFound(c, "用户不存在")
		case errors.Is(err, service.ErrInvalidOldPassword):
			utils.BadRequest(c, "旧密码错误")
		default:
			utils.InternalError(c, "修改密码失败")
		}
		return
	}

	utils.SuccessMessage(c, "密码修改成功")
}

// DeleteAccount 注销账户
func DeleteAccount(c *gin.Context) {
	userID := c.GetUint("userID")

	err := userService.DeleteAccount(userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "注销失败")
		return
	}

	utils.SuccessMessage(c, "账户已注销")
}

// GetReferralCode 获取邀请码
func GetReferralCode(c *gin.Context) {
	userID := c.GetUint("userID")

	info, err := userService.GetReferralInfo(userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.NotFound(c, "用户不存在")
			return
		}
		utils.InternalError(c, "获取邀请码失败")
		return
	}

	utils.Success(c, info)
}
