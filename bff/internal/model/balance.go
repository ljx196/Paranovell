package model

import (
	"encoding/json"
	"time"
)

// UserBalance 用户余额表
type UserBalance struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	UserID         uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	Balance        int64     `gorm:"not null;default:0" json:"balance"`
	TotalRecharged int64     `gorm:"not null;default:0" json:"total_recharged"`
	TotalConsumed  int64     `gorm:"not null;default:0" json:"total_consumed"`
	TotalGifted    int64     `gorm:"not null;default:0" json:"total_gifted"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (UserBalance) TableName() string {
	return "bff_schema.user_balance"
}

// Transaction 交易流水表
type Transaction struct {
	ID            uint            `gorm:"primaryKey" json:"id"`
	UserID        uint            `gorm:"not null;index" json:"user_id"`
	Type          string          `gorm:"size:20;not null" json:"type"`
	Amount        int64           `gorm:"not null" json:"amount"`
	BalanceAfter  int64           `gorm:"not null" json:"balance_after"`
	Description   string          `gorm:"size:200" json:"description"`
	ReferenceID   string          `gorm:"size:100;index" json:"reference_id"`
	ReferenceType string          `gorm:"size:20" json:"reference_type"`
	Metadata      json.RawMessage `gorm:"type:jsonb" json:"metadata"`
	CreatedAt     time.Time       `json:"created_at"`
}

func (Transaction) TableName() string {
	return "bff_schema.transactions"
}

// RechargeOrder 充值订单表
type RechargeOrder struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	UserID        uint       `gorm:"not null;index" json:"user_id"`
	OrderNo       string     `gorm:"uniqueIndex;size:64;not null" json:"order_no"`
	AmountYuan    float64    `gorm:"type:decimal(10,2);not null" json:"amount_yuan"`
	Points        int64      `gorm:"not null" json:"points"`
	PaymentMethod string     `gorm:"size:20" json:"payment_method"`
	Status        int8       `gorm:"not null;default:0" json:"status"` // 0-待支付 1-已支付 2-已取消 3-已退款
	PaidAt        *time.Time `json:"paid_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (RechargeOrder) TableName() string {
	return "bff_schema.recharge_orders"
}

// 交易类型常量
const (
	TxTypeRecharge    = "recharge"
	TxTypeConsumption = "consumption"
	TxTypeGift        = "gift"
	TxTypeReferral    = "referral"
	TxTypeRefund      = "refund"
)

// 订单状态常量
const (
	OrderStatusPending   int8 = 0
	OrderStatusPaid      int8 = 1
	OrderStatusCancelled int8 = 2
	OrderStatusRefunded  int8 = 3
)
