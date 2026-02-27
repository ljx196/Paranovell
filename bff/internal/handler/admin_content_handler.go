package handler

import (
	"errors"
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var (
	adminContentService       *service.AdminContentService
	adminSensitiveWordService *service.AdminSensitiveWordService
	contentScanService        *service.ContentScanService
)

// InitAdminContentService 初始化内容审查服务
func InitAdminContentService(cs *service.AdminContentService, sw *service.AdminSensitiveWordService, scan *service.ContentScanService) {
	adminContentService = cs
	adminSensitiveWordService = sw
	contentScanService = scan
}

// AdminGetConversations GET /api/admin/content/conversations
func AdminGetConversations(c *gin.Context) {
	var req dto.AdminConversationListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminContentService.ListConversations(&req)
	if err != nil {
		utils.InternalError(c, "获取对话列表失败: "+err.Error())
		return
	}
	utils.Success(c, result)
}

// AdminGetConversationMessages GET /api/admin/content/conversations/:id/messages
func AdminGetConversationMessages(c *gin.Context) {
	conversationID := c.Param("id")
	if conversationID == "" {
		utils.BadRequest(c, "无效的对话 ID")
		return
	}

	var req dto.AdminConversationMessagesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	result, err := adminContentService.GetMessages(conversationID, &req)
	if err != nil {
		utils.InternalError(c, "获取消息失败")
		return
	}
	utils.Success(c, result)
}

// AdminFlagConversation POST /api/admin/content/conversations/:id/flag
func AdminFlagConversation(c *gin.Context) {
	conversationID := c.Param("id")
	if conversationID == "" {
		utils.BadRequest(c, "无效的对话 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	var req dto.AdminFlagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	review, err := adminContentService.FlagConversation(adminID, conversationID, &req, ip)
	if err != nil {
		utils.InternalError(c, "标记失败")
		return
	}
	utils.Success(c, review)
}

// AdminReviewConversation POST /api/admin/content/conversations/:id/review
func AdminReviewConversation(c *gin.Context) {
	conversationID := c.Param("id")
	if conversationID == "" {
		utils.BadRequest(c, "无效的对话 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	var req dto.AdminReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	err := adminContentService.ReviewConversation(adminID, conversationID, &req, ip)
	if err != nil {
		if errors.Is(err, service.ErrReviewNotFound) {
			utils.NotFound(c, "审查记录不存在，请先标记")
			return
		}
		utils.InternalError(c, "审查失败")
		return
	}
	utils.SuccessMessage(c, "审查完成")
}

// AdminGetReviews GET /api/admin/content/reviews
func AdminGetReviews(c *gin.Context) {
	var req dto.AdminReviewListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminContentService.ListReviews(&req)
	if err != nil {
		utils.InternalError(c, "获取审查记录失败")
		return
	}
	utils.Success(c, result)
}

// AdminGetSensitiveWords GET /api/admin/content/sensitive-words
func AdminGetSensitiveWords(c *gin.Context) {
	var req dto.AdminSensitiveWordListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := adminSensitiveWordService.List(&req)
	if err != nil {
		utils.InternalError(c, "获取敏感词列表失败")
		return
	}
	utils.Success(c, result)
}

// AdminCreateSensitiveWords POST /api/admin/content/sensitive-words
func AdminCreateSensitiveWords(c *gin.Context) {
	adminID, ip := getAdminContext(c)

	var req dto.AdminBatchCreateSensitiveWordsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	result, err := adminSensitiveWordService.BatchCreate(adminID, &req, ip)
	if err != nil {
		utils.InternalError(c, "添加敏感词失败")
		return
	}
	utils.Success(c, result)
}

// AdminUpdateSensitiveWord PUT /api/admin/content/sensitive-words/:id
func AdminUpdateSensitiveWord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	var req dto.AdminUpdateSensitiveWordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if err := adminSensitiveWordService.Update(adminID, uint(id), &req, ip); err != nil {
		if errors.Is(err, service.ErrSensitiveWordNotFound) {
			utils.NotFound(c, "敏感词不存在")
			return
		}
		utils.InternalError(c, "修改失败")
		return
	}
	utils.SuccessMessage(c, "修改成功")
}

// AdminDeleteSensitiveWord DELETE /api/admin/content/sensitive-words/:id
func AdminDeleteSensitiveWord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的 ID")
		return
	}
	adminID, ip := getAdminContext(c)

	if err := adminSensitiveWordService.Delete(adminID, uint(id), ip); err != nil {
		if errors.Is(err, service.ErrSensitiveWordNotFound) {
			utils.NotFound(c, "敏感词不存在")
			return
		}
		utils.InternalError(c, "删除失败")
		return
	}
	utils.SuccessMessage(c, "删除成功")
}

// AdminScanContent POST /api/admin/content/scan
func AdminScanContent(c *gin.Context) {
	adminID, ip := getAdminContext(c)

	var req dto.AdminScanRequest
	c.ShouldBindJSON(&req)

	result, err := contentScanService.Scan(adminID, &req, ip)
	if err != nil {
		utils.InternalError(c, "扫描失败: "+err.Error())
		return
	}
	utils.Success(c, result)
}
