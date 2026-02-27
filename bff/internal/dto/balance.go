package dto

import (
	"encoding/json"
	"time"
)

// ==================== 余额 ====================

// BalanceResponse 余额查询响应
type BalanceResponse struct {
	Balance        int64 `json:"balance"`
	TotalRecharged int64 `json:"total_recharged"`
	TotalConsumed  int64 `json:"total_consumed"`
	TotalGifted    int64 `json:"total_gifted"`
}

// BalanceCheckResponse 余额检查响应
type BalanceCheckResponse struct {
	Sufficient    bool  `json:"sufficient"`
	Balance       int64 `json:"balance"`
	EstimatedCost int64 `json:"estimated_cost,omitempty"`
}

// ==================== 交易记录 ====================

// TransactionListRequest 交易记录列表请求
type TransactionListRequest struct {
	Type     string `form:"type" binding:"omitempty,oneof=all recharge consumption gift_referral"`
	Days     int    `form:"days" binding:"omitempty,oneof=7 30 90 180"`
	Page     int    `form:"page" binding:"omitempty,min=1"`
	PageSize int    `form:"page_size" binding:"omitempty,min=1,max=100"`
}

func (r *TransactionListRequest) GetPage() int {
	if r.Page <= 0 {
		return 1
	}
	return r.Page
}

func (r *TransactionListRequest) GetPageSize() int {
	if r.PageSize <= 0 {
		return 20
	}
	return r.PageSize
}

func (r *TransactionListRequest) GetOffset() int {
	return (r.GetPage() - 1) * r.GetPageSize()
}

func (r *TransactionListRequest) GetDays() int {
	if r.Days <= 0 {
		return 30
	}
	return r.Days
}

// TransactionResponse 单条交易响应
type TransactionResponse struct {
	ID           uint            `json:"id"`
	Type         string          `json:"type"`
	Amount       int64           `json:"amount"`
	BalanceAfter int64           `json:"balance_after"`
	Description  string          `json:"description"`
	CreatedAt    time.Time       `json:"created_at"`
	Metadata     json.RawMessage `json:"metadata,omitempty"`
}

// TransactionListResponse 交易记录列表响应
type TransactionListResponse struct {
	Transactions []TransactionResponse `json:"transactions"`
	Total        int64                 `json:"total"`
	Page         int                   `json:"page"`
	PageSize     int                   `json:"page_size"`
}

// ==================== 充值 ====================

// RechargeConfigResponse 充值配置响应
type RechargeConfigResponse struct {
	ExchangeRate   int                    `json:"exchange_rate"`
	MinAmountYuan  float64                `json:"min_amount_yuan"`
	Presets        []RechargePresetDTO    `json:"presets"`
	PaymentMethods []string               `json:"payment_methods"`
}

// RechargePresetDTO 充值档位
type RechargePresetDTO struct {
	AmountYuan float64 `json:"amount_yuan"`
	Points     int64   `json:"points"`
}

// CreateRechargeRequest 创建充值订单请求
type CreateRechargeRequest struct {
	AmountYuan    float64 `json:"amount_yuan" binding:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" binding:"required,oneof=alipay wechat"`
}

// CreateRechargeResponse 创建充值订单响应
type CreateRechargeResponse struct {
	OrderNo       string  `json:"order_no"`
	AmountYuan    float64 `json:"amount_yuan"`
	Points        int64   `json:"points"`
	PaymentMethod string  `json:"payment_method"`
	PaymentURL    string  `json:"payment_url,omitempty"`
	ExpireAt      string  `json:"expire_at"`
}

// OrderStatusResponse 订单状态响应
type OrderStatusResponse struct {
	OrderNo    string     `json:"order_no"`
	Status     int8       `json:"status"`
	StatusText string     `json:"status_text"`
	Points     int64      `json:"points"`
	PaidAt     *time.Time `json:"paid_at,omitempty"`
}

// PaymentCallbackRequest 支付回调请求
type PaymentCallbackRequest struct {
	OrderNo       string  `json:"order_no" binding:"required"`
	TradeNo       string  `json:"trade_no" binding:"required"`
	AmountYuan    float64 `json:"amount_yuan" binding:"required"`
	Status        string  `json:"status" binding:"required"` // success / fail
	PaymentMethod string  `json:"payment_method"`
	Sign          string  `json:"sign" binding:"required"`
}

// ==================== 费率 ====================

// PricingResponse 费率配置响应
type PricingResponse struct {
	Models              []ModelPricingResponse `json:"models"`
	ExchangeRate        int                    `json:"exchange_rate"`
	ExchangeDescription string                 `json:"exchange_description"`
}

// ModelPricingResponse 模型费率响应
type ModelPricingResponse struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	InputPrice  int    `json:"input_price"`
	OutputPrice int    `json:"output_price"`
	Unit        string `json:"unit"`
}

// ==================== 用量扩展 ====================

// ConversationRankingRequest 会话消费排行请求
type ConversationRankingRequest struct {
	Days     int `form:"days" binding:"omitempty,oneof=7 30 90 180"`
	Page     int `form:"page" binding:"omitempty,min=1"`
	PageSize int `form:"page_size" binding:"omitempty,min=1,max=50"`
}

func (r *ConversationRankingRequest) GetDays() int {
	if r.Days <= 0 {
		return 30
	}
	return r.Days
}

func (r *ConversationRankingRequest) GetPage() int {
	if r.Page <= 0 {
		return 1
	}
	return r.Page
}

func (r *ConversationRankingRequest) GetPageSize() int {
	if r.PageSize <= 0 {
		return 10
	}
	return r.PageSize
}

func (r *ConversationRankingRequest) GetOffset() int {
	return (r.GetPage() - 1) * r.GetPageSize()
}

// ConversationUsageResponse 会话消费排行响应
type ConversationUsageResponse struct {
	ConversationID uint      `json:"conversation_id"`
	Title          string    `json:"title"`
	TotalPoints    int64     `json:"total_points"`
	TotalTokens    int64     `json:"total_tokens"`
	MessageCount   int64     `json:"message_count"`
	LastUsedAt     time.Time `json:"last_used_at"`
}

// ConversationRankingResponse 会话排行列表响应
type ConversationRankingResponse struct {
	Conversations []ConversationUsageResponse `json:"conversations"`
	Total         int64                       `json:"total"`
	Page          int                         `json:"page"`
	PageSize      int                         `json:"page_size"`
}

// DailyUsageExtendedResponse 扩展的每日用量响应（含点数）
type DailyUsageExtendedResponse struct {
	Date           string `json:"date"`
	InputTokens    int64  `json:"input_tokens"`
	OutputTokens   int64  `json:"output_tokens"`
	TotalTokens    int64  `json:"total_tokens"`
	PointsConsumed int64  `json:"points_consumed"`
}
