package service

import (
	"context"
	"fmt"
	"io"
	"log"
	"strconv"

	"github.com/gennovelweb/bff/internal/client"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

// ChatService Chat 业务编排层
type ChatService struct {
	algorithmClient client.AlgorithmClientInterface
	balanceService  *BalanceService
	pricingService  *PricingService
}

// NewChatService 创建 ChatService
func NewChatService(algClient client.AlgorithmClientInterface, balanceSvc *BalanceService, pricingSvc *PricingService) *ChatService {
	return &ChatService{
		algorithmClient: algClient,
		balanceService:  balanceSvc,
		pricingService:  pricingSvc,
	}
}

// CreateConversation 创建会话
func (s *ChatService) CreateConversation(ctx context.Context, userID uint, req *dto.CreateConversationRequest) (*dto.ConversationResponse, error) {
	result, err := s.algorithmClient.CreateConversation(ctx, userID, req.Title, req.Model)
	if err != nil {
		return nil, err
	}

	return &dto.ConversationResponse{
		ID:        result.ID,
		Title:     result.Title,
		Model:     result.Model,
		CreatedAt: result.CreatedAt,
		UpdatedAt: result.CreatedAt,
	}, nil
}

// ListConversations 获取会话列表
func (s *ChatService) ListConversations(ctx context.Context, userID uint, req *dto.ConversationListRequest) (*dto.ConversationListResponse, error) {
	result, err := s.algorithmClient.ListConversations(ctx, userID, req.GetPage(), req.GetPageSize())
	if err != nil {
		return nil, err
	}

	conversations := make([]dto.ConversationResponse, len(result.Conversations))
	for i, c := range result.Conversations {
		conversations[i] = dto.ConversationResponse{
			ID:           c.ID,
			Title:        c.Title,
			Model:        c.Model,
			LastMessage:  c.LastMessage,
			MessageCount: c.MessageCount,
			CreatedAt:    c.CreatedAt,
			UpdatedAt:    c.UpdatedAt,
		}
	}

	return &dto.ConversationListResponse{
		Conversations: conversations,
		Total:         result.Total,
	}, nil
}

// DeleteConversation 删除会话
func (s *ChatService) DeleteConversation(ctx context.Context, userID uint, conversationID string) error {
	return s.algorithmClient.DeleteConversation(ctx, userID, conversationID)
}

// GetMessages 获取消息列表
func (s *ChatService) GetMessages(ctx context.Context, userID uint, conversationID string, req *dto.ChatMessageListRequest) (*dto.ChatMessageListResponse, error) {
	result, err := s.algorithmClient.GetMessages(ctx, userID, conversationID, req.GetPage(), req.GetPageSize())
	if err != nil {
		return nil, err
	}

	messages := make([]dto.ChatMessageResponse, len(result.Messages))
	for i, m := range result.Messages {
		messages[i] = dto.ChatMessageResponse{
			ID:        m.ID,
			Role:      m.Role,
			Content:   m.Content,
			CreatedAt: m.CreatedAt,
		}
	}

	return &dto.ChatMessageListResponse{
		Messages: messages,
		Total:    result.Total,
	}, nil
}

// SendMessage 发送消息（核心流程：余额检查 → 调用算法 → 扣费 → 记录用量）
func (s *ChatService) SendMessage(ctx context.Context, userID uint, conversationID string, req *dto.ChatMessageRequest) (*dto.SendMessageResponse, error) {
	// 1. 余额预检
	modelName := req.Model
	if modelName == "" {
		modelName = "standard"
	}
	if err := s.CheckBalanceForChat(userID, modelName); err != nil {
		return nil, err
	}

	// 2. 调用算法后端发送消息
	result, err := s.algorithmClient.SendMessage(ctx, userID, conversationID, req.Content, modelName)
	if err != nil {
		return nil, err
	}

	// 3. 计费 + 扣费 + 记录用量（失败仅记录日志，AI 已回复用户）
	s.RecordUsageAndDeduct(userID, conversationID, &dto.TokenUsageInfo{
		InputTokens:  result.Usage.InputTokens,
		OutputTokens: result.Usage.OutputTokens,
		TotalTokens:  result.Usage.TotalTokens,
		Model:        result.Usage.Model,
	})

	// 4. 构造响应
	return &dto.SendMessageResponse{
		Message: dto.ChatMessageResponse{
			ID:        result.Message.ID,
			Role:      result.Message.Role,
			Content:   result.Message.Content,
			CreatedAt: result.Message.CreatedAt,
		},
		Usage: dto.TokenUsageInfo{
			InputTokens:  result.Usage.InputTokens,
			OutputTokens: result.Usage.OutputTokens,
			TotalTokens:  result.Usage.TotalTokens,
			Model:        result.Usage.Model,
		},
	}, nil
}

// StreamMessage 流式对话（余额预检 + 打开流）
func (s *ChatService) StreamMessage(ctx context.Context, userID uint, conversationID string, req *dto.ChatMessageRequest) (io.ReadCloser, error) {
	modelName := req.Model
	if modelName == "" {
		modelName = "standard"
	}

	// 余额预检
	if err := s.CheckBalanceForChat(userID, modelName); err != nil {
		return nil, err
	}

	return s.algorithmClient.StreamMessage(ctx, userID, conversationID, req.Content, modelName)
}

// RecordUsageAndDeduct 记录用量并扣费
func (s *ChatService) RecordUsageAndDeduct(userID uint, conversationID string, usage *dto.TokenUsageInfo) {
	modelName := usage.Model
	if modelName == "" {
		modelName = "standard"
	}

	// 计算消耗积分
	points := s.pricingService.CalculatePoints(modelName, usage.InputTokens, usage.OutputTokens)

	// 扣费
	metadata := map[string]interface{}{
		"model":         modelName,
		"input_tokens":  usage.InputTokens,
		"output_tokens": usage.OutputTokens,
		"total_tokens":  usage.TotalTokens,
	}
	err := s.balanceService.Deduct(userID, points, "AI对话消费", conversationID, "chat", metadata)
	if err != nil {
		log.Printf("[ChatService] deduct balance failed for user %d: %v (points=%d)", userID, err, points)
	}

	// 记录 token 用量
	convID, _ := strconv.ParseUint(conversationID, 10, 64)
	usageRecord := &model.TokenUsage{
		UserID:         userID,
		ConversationID: uint(convID),
		InputTokens:    usage.InputTokens,
		OutputTokens:   usage.OutputTokens,
		TotalTokens:    usage.TotalTokens,
		Model:          modelName,
		PointsConsumed: points,
	}
	if err := database.GetDB().Create(usageRecord).Error; err != nil {
		log.Printf("[ChatService] record token usage failed for user %d: %v", userID, err)
	}
}

// CheckBalanceForChat 对话前余额检查
func (s *ChatService) CheckBalanceForChat(userID uint, modelName string) error {
	check, err := s.balanceService.CheckBalance(userID, modelName)
	if err != nil {
		return fmt.Errorf("check balance: %w", err)
	}
	if !check.Sufficient {
		return ErrInsufficientBalance
	}
	return nil
}
