package dto

import "time"

// SystemMessageResponse 系统消息响应
type SystemMessageResponse struct {
	ID        uint       `json:"id"`
	Title     string     `json:"title"`
	Content   string     `json:"content"`
	MsgType   string     `json:"msg_type"`
	IsRead    bool       `json:"is_read"`
	CreatedAt time.Time  `json:"created_at"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
}

// MessageListResponse 消息列表响应
type MessageListResponse struct {
	Messages []SystemMessageResponse `json:"messages"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"page_size"`
}

// UnreadCountResponse 未读消息数响应
type UnreadCountResponse struct {
	Count int64 `json:"count"`
}

// UsageSummaryResponse 用量汇总响应
type UsageSummaryResponse struct {
	TotalInputTokens  int64 `json:"total_input_tokens"`
	TotalOutputTokens int64 `json:"total_output_tokens"`
	TotalTokens       int64 `json:"total_tokens"`
}

// DailyUsageResponse 每日用量响应
type DailyUsageResponse struct {
	Date         string `json:"date"`
	InputTokens  int64  `json:"input_tokens"`
	OutputTokens int64  `json:"output_tokens"`
	TotalTokens  int64  `json:"total_tokens"`
}

// UsageDetailResponse 用量明细响应
type UsageDetailResponse struct {
	Daily []DailyUsageResponse `json:"daily"`
	Total UsageSummaryResponse `json:"total"`
}

// MessageListRequest 消息列表请求
type MessageListRequest struct {
	Page     int    `form:"page" binding:"omitempty,min=1"`
	PageSize int    `form:"page_size" binding:"omitempty,min=1,max=100"`
	MsgType  string `form:"msg_type" binding:"omitempty,oneof=account notice usage"`
}

func (r *MessageListRequest) GetPage() int {
	if r.Page <= 0 {
		return 1
	}
	return r.Page
}

func (r *MessageListRequest) GetPageSize() int {
	if r.PageSize <= 0 {
		return 20
	}
	return r.PageSize
}

func (r *MessageListRequest) GetOffset() int {
	return (r.GetPage() - 1) * r.GetPageSize()
}

// PaginationRequest 分页请求
type PaginationRequest struct {
	Page     int `form:"page" binding:"omitempty,min=1"`
	PageSize int `form:"page_size" binding:"omitempty,min=1,max=100"`
}

func (p *PaginationRequest) GetPage() int {
	if p.Page <= 0 {
		return 1
	}
	return p.Page
}

func (p *PaginationRequest) GetPageSize() int {
	if p.PageSize <= 0 {
		return 20
	}
	return p.PageSize
}

func (p *PaginationRequest) GetOffset() int {
	return (p.GetPage() - 1) * p.GetPageSize()
}
