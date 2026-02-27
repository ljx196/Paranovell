package handler

import (
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var adminAnnounceService *service.AdminAnnounceService

func InitAdminAnnounceService(as *service.AdminAuditService) {
	adminAnnounceService = service.NewAdminAnnounceService(as)
}

// AdminGetAnnouncements GET /api/admin/announcements
func AdminGetAnnouncements(c *gin.Context) {
	var req dto.AdminAnnouncementListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminAnnounceService.List(&req)
	if err != nil {
		utils.InternalError(c, "获取公告列表失败")
		return
	}
	utils.Success(c, result)
}

// AdminCreateAnnouncement POST /api/admin/announcements
func AdminCreateAnnouncement(c *gin.Context) {
	adminID, ip := getAdminContext(c)

	var req dto.CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if req.Target == "specific" && len(req.TargetEmails) == 0 {
		utils.BadRequest(c, "指定用户时 target_emails 不能为空")
		return
	}

	err := adminAnnounceService.Create(adminID, &req, ip)
	if err != nil {
		utils.InternalError(c, "发送公告失败: "+err.Error())
		return
	}
	utils.SuccessMessage(c, "公告已发送")
}

// AdminDeleteAnnouncement DELETE /api/admin/announcements/:id
func AdminDeleteAnnouncement(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的公告 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	err = adminAnnounceService.Delete(adminID, uint(id), ip)
	if err != nil {
		utils.InternalError(c, "删除公告失败")
		return
	}
	utils.SuccessMessage(c, "公告已删除")
}
