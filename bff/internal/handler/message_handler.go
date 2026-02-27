package handler

import (
	"errors"
	"strconv"

	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var messageService = service.NewMessageService()

// ListMessages 获取消息列表
// @Summary 获取系统消息列表
// @Description 获取当前用户的系统消息列表，支持分页和类型筛选
// @Tags messages
// @Param page query int false "页码，默认1"
// @Param page_size query int false "每页数量，默认20，最大100"
// @Param msg_type query string false "消息类型筛选：account/notice/usage"
// @Success 200 {object} dto.MessageListResponse
// @Router /api/v1/messages [get]
func ListMessages(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.MessageListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误：msg_type 必须是 account、notice 或 usage")
		return
	}

	result, err := messageService.ListMessages(userID, &req)
	if err != nil {
		utils.InternalError(c, "获取消息列表失败")
		return
	}

	utils.Success(c, result)
}

// GetMessage 获取单条消息
func GetMessage(c *gin.Context) {
	userID := c.GetUint("userID")
	messageID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的消息 ID")
		return
	}

	msg, err := messageService.GetMessage(userID, uint(messageID))
	if err != nil {
		if errors.Is(err, service.ErrMessageNotFound) {
			utils.NotFound(c, "消息不存在")
			return
		}
		utils.InternalError(c, "获取消息失败")
		return
	}

	utils.Success(c, dto.SystemMessageResponse{
		ID:        msg.ID,
		Title:     msg.Title,
		Content:   msg.Content,
		MsgType:   msg.MsgType,
		IsRead:    msg.IsRead,
		CreatedAt: msg.CreatedAt,
		ReadAt:    msg.ReadAt,
	})
}

// MarkAsRead 标记消息为已读
func MarkAsRead(c *gin.Context) {
	userID := c.GetUint("userID")
	messageID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的消息 ID")
		return
	}

	err = messageService.MarkAsRead(userID, uint(messageID))
	if err != nil {
		if errors.Is(err, service.ErrMessageNotFound) {
			utils.NotFound(c, "消息不存在")
			return
		}
		utils.InternalError(c, "标记已读失败")
		return
	}

	utils.SuccessMessage(c, "已标记为已读")
}

// MarkAllAsRead 标记所有消息为已读
func MarkAllAsRead(c *gin.Context) {
	userID := c.GetUint("userID")

	count, err := messageService.MarkAllAsRead(userID)
	if err != nil {
		utils.InternalError(c, "标记已读失败")
		return
	}

	utils.Success(c, gin.H{
		"marked_count": count,
	})
}

// GetUnreadCount 获取未读消息数
func GetUnreadCount(c *gin.Context) {
	userID := c.GetUint("userID")

	count, err := messageService.GetUnreadCount(userID)
	if err != nil {
		utils.InternalError(c, "获取未读数失败")
		return
	}

	utils.Success(c, dto.UnreadCountResponse{
		Count: count,
	})
}
