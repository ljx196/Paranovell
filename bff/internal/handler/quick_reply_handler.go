package handler

import (
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var quickReplyService = service.NewQuickReplyService()

// GetQuickReplies 获取快捷回复列表
// @Summary 获取聊天快捷回复选项
// @Description 返回最多3条激活的快捷回复选项
// @Tags chat
// @Success 200 {object} dto.QuickReplyListResponse
// @Router /api/v1/chat/quick-replies [get]
func GetQuickReplies(c *gin.Context) {
	result, err := quickReplyService.GetActiveQuickReplies()
	if err != nil {
		utils.InternalError(c, "获取快捷回复失败")
		return
	}

	utils.Success(c, result)
}
