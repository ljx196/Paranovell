package handler

import (
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminConfigService *service.AdminConfigService

func InitAdminConfigService(s *service.AdminConfigService) {
	adminConfigService = s
}

// AdminGetConfigs GET /api/admin/configs
func AdminGetConfigs(c *gin.Context) {
	result, err := adminConfigService.GetAll()
	if err != nil {
		utils.InternalError(c, "获取配置失败")
		return
	}
	utils.Success(c, result)
}

// AdminUpdateConfigs PUT /api/admin/configs
func AdminUpdateConfigs(c *gin.Context) {
	adminID, ip := getAdminContext(c)

	var req dto.UpdateConfigsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	err := adminConfigService.BatchUpdate(adminID, &req, ip)
	if err != nil {
		utils.InternalError(c, "更新配置失败")
		return
	}
	utils.SuccessMessage(c, "配置已更新")
}

// getAdminContext 从 Context 获取管理员信息
func getAdminContext(c *gin.Context) (adminID uint, ip string) {
	adminID = c.GetUint("adminID")
	ip = c.ClientIP()
	return
}
