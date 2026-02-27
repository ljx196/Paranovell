package handler

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gennovelweb/bff/internal/client"
	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var chatService *service.ChatService
var algorithmClient client.AlgorithmClientInterface

// InitChatService 初始化 ChatService
func InitChatService(cfg *config.AlgorithmConfig, bs *service.BalanceService, ps *service.PricingService) {
	algorithmClient = client.NewAlgorithmClient(cfg)
	chatService = service.NewChatService(algorithmClient, bs, ps)
}

// GetAlgorithmClient 获取算法后端客户端实例
func GetAlgorithmClient() client.AlgorithmClientInterface {
	return algorithmClient
}

// ListConversations GET /api/v1/chat/conversations
func ListConversations(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.ConversationListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := chatService.ListConversations(c.Request.Context(), userID, &req)
	if err != nil {
		handleAlgorithmError(c, err)
		return
	}

	utils.Success(c, result)
}

// CreateConversation POST /api/v1/chat/conversations
func CreateConversation(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := chatService.CreateConversation(c.Request.Context(), userID, &req)
	if err != nil {
		handleAlgorithmError(c, err)
		return
	}

	utils.Success(c, result)
}

// DeleteConversation DELETE /api/v1/chat/conversations/:id
func DeleteConversation(c *gin.Context) {
	userID := c.GetUint("userID")
	conversationID := c.Param("id")

	if err := chatService.DeleteConversation(c.Request.Context(), userID, conversationID); err != nil {
		handleAlgorithmError(c, err)
		return
	}

	utils.SuccessMessage(c, "会话已删除")
}

// GetMessages GET /api/v1/chat/conversations/:id/messages
func GetMessages(c *gin.Context) {
	userID := c.GetUint("userID")
	conversationID := c.Param("id")

	var req dto.ChatMessageListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := chatService.GetMessages(c.Request.Context(), userID, conversationID, &req)
	if err != nil {
		handleAlgorithmError(c, err)
		return
	}

	utils.Success(c, result)
}

// SendMessage POST /api/v1/chat/conversations/:id/messages
func SendMessage(c *gin.Context) {
	userID := c.GetUint("userID")
	conversationID := c.Param("id")

	var req dto.ChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	result, err := chatService.SendMessage(c.Request.Context(), userID, conversationID, &req)
	if err != nil {
		if errors.Is(err, service.ErrInsufficientBalance) {
			utils.Error(c, http.StatusPaymentRequired, utils.CodeInsufficientBalance, "余额不足，请先充值")
			return
		}
		handleAlgorithmError(c, err)
		return
	}

	utils.Success(c, result)
}

// StreamMessage POST /api/v1/chat/conversations/:id/messages/stream
func StreamMessage(c *gin.Context) {
	userID := c.GetUint("userID")
	conversationID := c.Param("id")

	var req dto.ChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误")
		return
	}

	// 获取 SSE 流
	stream, err := chatService.StreamMessage(c.Request.Context(), userID, conversationID, &req)
	if err != nil {
		if errors.Is(err, service.ErrInsufficientBalance) {
			utils.Error(c, http.StatusPaymentRequired, utils.CodeInsufficientBalance, "余额不足，请先充值")
			return
		}
		handleAlgorithmError(c, err)
		return
	}
	defer stream.Close()

	// 设置 SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		utils.InternalError(c, "streaming not supported")
		return
	}

	var lastUsage *dto.TokenUsageInfo

	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		line := scanner.Text()

		// 解析 SSE "data:" 行
		if !strings.HasPrefix(line, "data:") {
			// 转发非数据行（如 "event:" 行）
			if line != "" {
				fmt.Fprintf(c.Writer, "%s\n", line)
			} else {
				fmt.Fprint(c.Writer, "\n")
				flusher.Flush()
			}
			continue
		}

		// 转发数据行给前端
		fmt.Fprintf(c.Writer, "%s\n", line)

		// 尝试解析事件以拦截 done 事件中的 usage
		dataStr := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		var event dto.StreamEvent
		if json.Unmarshal([]byte(dataStr), &event) == nil && event.Type == "done" && event.Usage != nil {
			lastUsage = event.Usage
		}
	}

	// 确保最后一个事件被 flush
	flusher.Flush()

	// 流结束后记录用量和扣费
	if lastUsage != nil {
		chatService.RecordUsageAndDeduct(userID, conversationID, lastUsage)
	} else {
		log.Printf("[StreamMessage] no usage info received for user %d, conversation %s", userID, conversationID)
	}
}

// WebSocketHandler WebSocket 处理（已替换为 SSE 方案）
func WebSocketHandler(c *gin.Context) {
	utils.BadRequest(c, "请使用 SSE 流式接口：POST /api/v1/chat/conversations/:id/messages/stream")
}

// handleAlgorithmError 算法后端错误统一处理
func handleAlgorithmError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, client.ErrConversationNotFound):
		utils.NotFound(c, "会话不存在")
	case errors.Is(err, client.ErrAlgorithmUnavailable):
		utils.Error(c, http.StatusServiceUnavailable, utils.CodeAlgorithmUnavailable, "AI 服务暂时不可用，请稍后重试")
	case errors.Is(err, client.ErrAlgorithmBadRequest):
		utils.BadRequest(c, "请求参数错误")
	default:
		utils.InternalError(c, "服务异常")
	}
}
