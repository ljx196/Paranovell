package dto

import "time"

// ==================== 会话 ====================

// CreateConversationRequest 创建会话请求
type CreateConversationRequest struct {
	Title string `json:"title" binding:"omitempty,max=100"`
	Model string `json:"model" binding:"omitempty,max=50"`
}

// ConversationResponse 会话响应
type ConversationResponse struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Model        string    `json:"model"`
	LastMessage  string    `json:"last_message,omitempty"`
	MessageCount int       `json:"message_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ConversationListRequest 会话列表请求
type ConversationListRequest struct {
	Page     int `form:"page" binding:"omitempty,min=1"`
	PageSize int `form:"page_size" binding:"omitempty,min=1,max=100"`
}

func (r *ConversationListRequest) GetPage() int {
	if r.Page <= 0 {
		return 1
	}
	return r.Page
}

func (r *ConversationListRequest) GetPageSize() int {
	if r.PageSize <= 0 {
		return 20
	}
	return r.PageSize
}

func (r *ConversationListRequest) GetOffset() int {
	return (r.GetPage() - 1) * r.GetPageSize()
}

// ConversationListResponse 会话列表响应
type ConversationListResponse struct {
	Conversations []ConversationResponse `json:"conversations"`
	Total         int64                  `json:"total"`
}

// ==================== 消息 ====================

// ChatMessageRequest 发送消息请求
type ChatMessageRequest struct {
	Content string `json:"content" binding:"required,max=10000"`
	Model   string `json:"model" binding:"omitempty,max=50"`
}

// ChatMessageResponse 消息响应
type ChatMessageResponse struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// ChatMessageListRequest 消息列表请求
type ChatMessageListRequest struct {
	Page     int `form:"page" binding:"omitempty,min=1"`
	PageSize int `form:"page_size" binding:"omitempty,min=1,max=100"`
}

func (r *ChatMessageListRequest) GetPage() int {
	if r.Page <= 0 {
		return 1
	}
	return r.Page
}

func (r *ChatMessageListRequest) GetPageSize() int {
	if r.PageSize <= 0 {
		return 50
	}
	return r.PageSize
}

func (r *ChatMessageListRequest) GetOffset() int {
	return (r.GetPage() - 1) * r.GetPageSize()
}

// ChatMessageListResponse 消息列表响应
type ChatMessageListResponse struct {
	Messages []ChatMessageResponse `json:"messages"`
	Total    int64                 `json:"total"`
}

// ==================== AI 回复 + Token 用量 ====================

// TokenUsageInfo Token 用量信息
type TokenUsageInfo struct {
	InputTokens  int    `json:"input_tokens"`
	OutputTokens int    `json:"output_tokens"`
	TotalTokens  int    `json:"total_tokens"`
	Model        string `json:"model"`
}

// SendMessageResponse 发送消息响应（含 AI 回复和用量）
type SendMessageResponse struct {
	Message ChatMessageResponse `json:"message"`
	Usage   TokenUsageInfo      `json:"usage"`
}

// ==================== SSE 流式事件 ====================

// StreamEvent SSE 流式事件
type StreamEvent struct {
	Type    string          `json:"type"`    // "token", "done", "error"
	Content string          `json:"content,omitempty"`
	Usage   *TokenUsageInfo `json:"usage,omitempty"`
	Error   string          `json:"error,omitempty"`
}
