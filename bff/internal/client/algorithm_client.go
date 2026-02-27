package client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gennovelweb/bff/internal/config"
)

// 错误定义
var (
	ErrConversationNotFound  = errors.New("conversation not found")
	ErrAlgorithmBadRequest   = errors.New("algorithm backend bad request")
	ErrAlgorithmUnavailable  = errors.New("algorithm backend unavailable")
	ErrAlgorithmInternalError = errors.New("algorithm backend internal error")
)

// AlgorithmClientInterface 算法后端客户端接口（便于测试 mock）
type AlgorithmClientInterface interface {
	CreateConversation(ctx context.Context, userID uint, title, model string) (*ConversationResult, error)
	ListConversations(ctx context.Context, userID uint, page, pageSize int) (*ConversationListResult, error)
	DeleteConversation(ctx context.Context, userID uint, conversationID string) error
	GetMessages(ctx context.Context, userID uint, conversationID string, page, pageSize int) (*MessageListResult, error)
	SendMessage(ctx context.Context, userID uint, conversationID, content, model string) (*SendMessageResult, error)
	StreamMessage(ctx context.Context, userID uint, conversationID, content, model string) (io.ReadCloser, error)
}

// ==================== 内部结果类型 ====================

// algorithmResponse 算法后端通用响应信封
type algorithmResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

// ConversationResult 创建会话结果
type ConversationResult struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Model     string    `json:"model"`
	CreatedAt time.Time `json:"created_at"`
}

// ConversationItem 会话列表项
type ConversationItem struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Model        string    `json:"model"`
	LastMessage  string    `json:"last_message"`
	MessageCount int       `json:"message_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ConversationListResult 会话列表结果
type ConversationListResult struct {
	Conversations []ConversationItem `json:"conversations"`
	Total         int64              `json:"total"`
}

// MessageItem 消息项
type MessageItem struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// MessageListResult 消息列表结果
type MessageListResult struct {
	Messages []MessageItem `json:"messages"`
	Total    int64         `json:"total"`
}

// UsageInfo Token 用量
type UsageInfo struct {
	InputTokens  int    `json:"input_tokens"`
	OutputTokens int    `json:"output_tokens"`
	TotalTokens  int    `json:"total_tokens"`
	Model        string `json:"model"`
}

// SendMessageResult 发送消息结果
type SendMessageResult struct {
	Message MessageItem `json:"message"`
	Usage   UsageInfo   `json:"usage"`
}

// ==================== AlgorithmClient 实现 ====================

// AlgorithmClient 算法后端 HTTP 客户端
type AlgorithmClient struct {
	baseURL    string
	httpClient *http.Client
	maxRetry   int
}

// NewAlgorithmClient 创建算法后端客户端
func NewAlgorithmClient(cfg *config.AlgorithmConfig) *AlgorithmClient {
	timeout := time.Duration(cfg.Timeout) * time.Second
	if timeout <= 0 {
		timeout = 30 * time.Second
	}
	maxRetry := cfg.Retry
	if maxRetry <= 0 {
		maxRetry = 3
	}

	return &AlgorithmClient{
		baseURL: cfg.BaseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
		maxRetry: maxRetry,
	}
}

// CreateConversation 创建会话
func (c *AlgorithmClient) CreateConversation(ctx context.Context, userID uint, title, model string) (*ConversationResult, error) {
	body := map[string]interface{}{
		"user_id": userID,
		"title":   title,
		"model":   model,
	}

	data, err := c.doWithRetry(ctx, http.MethodPost, "/api/conversations", body)
	if err != nil {
		return nil, err
	}

	var result ConversationResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("parse conversation response: %w", err)
	}
	return &result, nil
}

// ListConversations 获取会话列表
func (c *AlgorithmClient) ListConversations(ctx context.Context, userID uint, page, pageSize int) (*ConversationListResult, error) {
	path := fmt.Sprintf("/api/conversations?user_id=%d&page=%d&page_size=%d", userID, page, pageSize)

	data, err := c.doWithRetry(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}

	var result ConversationListResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("parse conversation list response: %w", err)
	}
	return &result, nil
}

// DeleteConversation 删除会话
func (c *AlgorithmClient) DeleteConversation(ctx context.Context, userID uint, conversationID string) error {
	path := fmt.Sprintf("/api/conversations/%s?user_id=%d", conversationID, userID)

	_, err := c.doWithRetry(ctx, http.MethodDelete, path, nil)
	return err
}

// GetMessages 获取消息列表
func (c *AlgorithmClient) GetMessages(ctx context.Context, userID uint, conversationID string, page, pageSize int) (*MessageListResult, error) {
	path := fmt.Sprintf("/api/conversations/%s/messages?user_id=%d&page=%d&page_size=%d",
		conversationID, userID, page, pageSize)

	data, err := c.doWithRetry(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}

	var result MessageListResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("parse message list response: %w", err)
	}
	return &result, nil
}

// SendMessage 发送消息（同步）
func (c *AlgorithmClient) SendMessage(ctx context.Context, userID uint, conversationID, content, model string) (*SendMessageResult, error) {
	path := fmt.Sprintf("/api/conversations/%s/messages", conversationID)
	body := map[string]interface{}{
		"user_id": userID,
		"content": content,
		"model":   model,
	}

	data, err := c.doWithRetry(ctx, http.MethodPost, path, body)
	if err != nil {
		return nil, err
	}

	var result SendMessageResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("parse send message response: %w", err)
	}
	return &result, nil
}

// StreamMessage 流式对话（SSE），返回可读响应体
func (c *AlgorithmClient) StreamMessage(ctx context.Context, userID uint, conversationID, content, model string) (io.ReadCloser, error) {
	path := fmt.Sprintf("/api/conversations/%s/stream", conversationID)
	url := c.baseURL + path

	body := map[string]interface{}{
		"user_id": userID,
		"content": content,
		"model":   model,
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")

	// 流式请求不走重试（长连接场景不适合自动重试）
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, mapNetworkError(err)
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, mapHTTPError(resp.StatusCode)
	}

	return resp.Body, nil
}

// ==================== 内部方法 ====================

// doWithRetry 带重试的 HTTP 请求
func (c *AlgorithmClient) doWithRetry(ctx context.Context, method, path string, body interface{}) (json.RawMessage, error) {
	var lastErr error

	for attempt := 0; attempt < c.maxRetry; attempt++ {
		if attempt > 0 {
			// 指数退避: 100ms, 200ms, 400ms...
			backoff := time.Duration(100<<uint(attempt-1)) * time.Millisecond
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff):
			}
		}

		data, err := c.doRequest(ctx, method, path, body)
		if err == nil {
			return data, nil
		}

		// 4xx 错误不重试（客户端错误）
		if errors.Is(err, ErrConversationNotFound) ||
			errors.Is(err, ErrAlgorithmBadRequest) {
			return nil, err
		}

		lastErr = err
		log.Printf("[AlgorithmClient] attempt %d/%d failed: %v", attempt+1, c.maxRetry, err)
	}

	return nil, lastErr
}

// doRequest 执行单次 HTTP 请求
func (c *AlgorithmClient) doRequest(ctx context.Context, method, path string, body interface{}) (json.RawMessage, error) {
	url := c.baseURL + path

	var bodyReader io.Reader
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, mapNetworkError(err)
	}
	defer resp.Body.Close()

	// 非 2xx 状态码
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, mapHTTPError(resp.StatusCode)
	}

	// 解析响应信封
	var envelope algorithmResponse
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if envelope.Code != 0 {
		return nil, fmt.Errorf("algorithm error (code=%d): %s", envelope.Code, envelope.Message)
	}

	return envelope.Data, nil
}

// mapHTTPError 将 HTTP 状态码映射为业务错误
func mapHTTPError(statusCode int) error {
	switch {
	case statusCode == http.StatusNotFound:
		return ErrConversationNotFound
	case statusCode == http.StatusBadRequest:
		return ErrAlgorithmBadRequest
	case statusCode == http.StatusServiceUnavailable || statusCode == http.StatusGatewayTimeout:
		return ErrAlgorithmUnavailable
	default:
		return ErrAlgorithmInternalError
	}
}

// mapNetworkError 将网络错误映射为业务错误
func mapNetworkError(err error) error {
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		return ErrAlgorithmUnavailable
	}
	return fmt.Errorf("%w: %v", ErrAlgorithmUnavailable, err)
}
