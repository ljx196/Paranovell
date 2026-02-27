# 账户余额管理系统 — 后端技术方案

> 基于 PRD（docs/prd/account-balance.md）设计，遵循现有 BFF 分层架构（Handler → Service → Model），复用 Gin + GORM 技术栈。Redis 仅用于可选的余额查询缓存，所有核心逻辑由 PostgreSQL 事务保证。

---

## 1. 技术架构概述

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Handler Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │balance_handler│  │recharge_handler│ │pricing_handler│ │usage_h* │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
└─────────┼─────────────────┼─────────────────┼────────────────┼──────┘
          │                 │                 │                │
          ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Service Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │balance_service│  │recharge_svc  │  │pricing_svc   │              │
│  │              │  │              │  │              │              │
│  │ - GetBalance │  │ - GetConfig  │  │ - GetPricing │              │
│  │ - CheckBal.  │  │ - CreateOrder│  │              │              │
│  │ - Deduct     │  │ - HandleCB   │  └──────────────┘              │
│  │ - Credit     │  │ - GetStatus  │                                │
│  │ - GetTxns    │  └──────────────┘                                │
│  │ - GetDaily   │                                                  │
│  │ - GetConvRank│                                                  │
│  └──────────────┘                                                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │UserBalance│  │ Transaction  │  │ RechargeOrder  │  │TokenUsage*│ │
│  └──────────┘  └──────────────┘  └────────────────┘  └───────────┘ │
│                                                                      │
│  PostgreSQL (bff_schema)                Redis (可选缓存)              │
│  ┌──────────────────────────┐      ┌──────────────────────────┐    │
│  │ user_balance             │      │ balance:{user_id} (60s)  │    │
│  │ transactions             │      │                          │    │
│  │ recharge_orders          │      │                          │    │
│  │ token_usage (扩展)       │      │                          │    │
│  └──────────────────────────┘      └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 新增文件清单

```
bff/internal/
├── model/
│   └── balance.go              # UserBalance、Transaction、RechargeOrder 模型
├── dto/
│   └── balance.go              # 余额、交易、充值相关 DTO
├── handler/
│   ├── balance_handler.go      # 余额与交易记录接口
│   ├── recharge_handler.go     # 充值相关接口
│   └── pricing_handler.go      # 费率配置接口
├── service/
│   ├── balance_service.go      # 余额核心业务（扣费、入账、查询）
│   ├── recharge_service.go     # 充值订单与支付回调
│   └── pricing_service.go      # 费率配置
└── (usage_handler.go)          # 现有文件，扩展 conversations 排行接口
```

### 1.3 现有文件变更

| 文件 | 变更 |
|------|------|
| `cmd/server/main.go` | 注册新路由组 `/balance`、`/recharge`、`/pricing`，扩展 `/usage` |
| `internal/model/message.go` | TokenUsage 模型新增 `PointsConsumed` 字段 |
| `internal/database/database.go` | `InitSchema` 新增 AutoMigrate 模型，`createAdditionalIndexes` 新增索引 |
| `internal/service/auth_service.go` | Register 事务中新增创建 `user_balance` 记录及赠送初始点数逻辑 |
| `internal/handler/usage_handler.go` | 新增 `GetConversationRanking` handler |
| `internal/service/usage_service.go` | 新增 `GetConversationRanking` 方法，扩展 `GetDailyUsage` 支持点数维度 |
| `config.yaml` | 新增 `balance` 配置段（初始赠送、预警阈值、费率等） |

---

## 2. 数据模型

### 2.1 新增模型

**文件：`internal/model/balance.go`**

```go
package model

import (
    "time"
    "gorm.io/datatypes"
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
    Metadata      datatypes.JSON  `gorm:"type:jsonb" json:"metadata"`
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
```

### 2.2 现有模型改造

**文件：`internal/model/message.go` — TokenUsage 新增字段**

```go
type TokenUsage struct {
    ID             uint      `gorm:"primaryKey" json:"id"`
    UserID         uint      `gorm:"not null;index" json:"user_id"`
    ConversationID uint      `gorm:"not null;index" json:"conversation_id"`
    MessageID      uint      `gorm:"not null" json:"message_id"`
    InputTokens    int       `gorm:"not null" json:"input_tokens"`
    OutputTokens   int       `gorm:"not null" json:"output_tokens"`
    TotalTokens    int       `gorm:"not null" json:"total_tokens"`
    Model          string    `gorm:"size:50" json:"model"`
    PointsConsumed int64     `gorm:"default:0" json:"points_consumed"`   // ← 新增
    CreatedAt      time.Time `json:"created_at"`
}
```

### 2.3 数据库迁移与索引

**文件：`internal/database/database.go` — InitSchema 扩展**

```go
func InitSchema() error {
    DB.Exec("CREATE SCHEMA IF NOT EXISTS bff_schema")
    DB.Exec("CREATE SCHEMA IF NOT EXISTS chat_schema")

    err := DB.AutoMigrate(
        // 现有模型
        &model.User{},
        &model.UserPreference{},
        &model.Referral{},
        &model.SystemMessage{},
        &model.TokenUsage{},
        // 新增模型
        &model.UserBalance{},
        &model.Transaction{},
        &model.RechargeOrder{},
    )
    if err != nil {
        return err
    }
    return createAdditionalIndexes()
}
```

**新增索引**（追加到 `createAdditionalIndexes`）:

```go
// user_balance
`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_balance_user_id
 ON bff_schema.user_balance(user_id)`,

// transactions
`CREATE INDEX IF NOT EXISTS idx_transactions_user_type
 ON bff_schema.transactions(user_id, type)`,
`CREATE INDEX IF NOT EXISTS idx_transactions_user_date
 ON bff_schema.transactions(user_id, created_at DESC)`,
`CREATE INDEX IF NOT EXISTS idx_transactions_reference
 ON bff_schema.transactions(reference_id)`,

// recharge_orders
`CREATE UNIQUE INDEX IF NOT EXISTS idx_recharge_orders_order_no
 ON bff_schema.recharge_orders(order_no)`,
`CREATE INDEX IF NOT EXISTS idx_recharge_orders_user_status
 ON bff_schema.recharge_orders(user_id, status)`,
```

---

## 3. 配置扩展

### 3.1 config.yaml 新增段

```yaml
balance:
  # 新用户赠送
  initial_gift_points: 1000
  # 余额预警阈值
  low_balance_threshold: 500
  critical_balance_threshold: 100
  # 汇率
  exchange_rate: 100           # 1 元 = 100 点
  min_recharge_yuan: 1         # 最低充值 1 元
  # 充值档位
  recharge_presets:
    - { amount_yuan: 10,  points: 1000 }
    - { amount_yuan: 50,  points: 5000 }
    - { amount_yuan: 100, points: 10000 }
    - { amount_yuan: 500, points: 50000 }
  # 支付方式
  payment_methods:
    - alipay
    - wechat
  # 订单超时（分钟）
  order_timeout_minutes: 30
  # 模型费率
  models:
    - name: standard
      display_name: 标准模型
      input_price: 1      # 点/1K Tokens
      output_price: 2
    - name: advanced
      display_name: 高级模型
      input_price: 3
      output_price: 6
  # 邀请奖励
  referral:
    referrer_reward: 500          # 推荐人奖励（未使用，注册邀请奖励已移除）
    referee_gift: 1000            # 被推荐人赠送（含初始赠送）
    first_recharge_bonus_rate: 10 # 首充返利比例(%)
```

### 3.2 Config 结构体

**文件：`internal/config/config.go` 新增**

```go
type BalanceConfig struct {
    InitialGiftPoints         int64           `yaml:"initial_gift_points"`
    LowBalanceThreshold       int64           `yaml:"low_balance_threshold"`
    CriticalBalanceThreshold  int64           `yaml:"critical_balance_threshold"`
    ExchangeRate              int             `yaml:"exchange_rate"`
    MinRechargeYuan           float64         `yaml:"min_recharge_yuan"`
    RechargePresets           []RechargePreset `yaml:"recharge_presets"`
    PaymentMethods            []string        `yaml:"payment_methods"`
    OrderTimeoutMinutes       int             `yaml:"order_timeout_minutes"`
    Models                    []ModelPricing  `yaml:"models"`
    Referral                  ReferralConfig  `yaml:"referral"`
}

type RechargePreset struct {
    AmountYuan float64 `yaml:"amount_yuan" json:"amount_yuan"`
    Points     int64   `yaml:"points" json:"points"`
}

type ModelPricing struct {
    Name         string `yaml:"name" json:"name"`
    DisplayName  string `yaml:"display_name" json:"display_name"`
    InputPrice   int    `yaml:"input_price" json:"input_price"`
    OutputPrice  int    `yaml:"output_price" json:"output_price"`
}

type ReferralConfig struct {
    ReferrerReward        int64 `yaml:"referrer_reward"`
    RefereeGift           int64 `yaml:"referee_gift"`
    FirstRechargeBonusRate int  `yaml:"first_recharge_bonus_rate"`
}

// Config 主结构新增字段
type Config struct {
    // ... 现有字段
    Balance BalanceConfig `yaml:"balance"`
}
```

---

## 4. DTO 设计

**文件：`internal/dto/balance.go`**

```go
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
    Sufficient     bool  `json:"sufficient"`
    Balance        int64 `json:"balance"`
    EstimatedCost  int64 `json:"estimated_cost,omitempty"`
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
    ExchangeRate   int              `json:"exchange_rate"`
    MinAmountYuan  float64          `json:"min_amount_yuan"`
    Presets        []RechargePreset `json:"presets"`
    PaymentMethods []string         `json:"payment_methods"`
}

// RechargePreset 充值档位（复用 config 中定义）
type RechargePreset struct {
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

// PaymentCallbackRequest 支付回调请求（简化，实际根据支付平台调整）
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
```

---

## 5. Service 层设计

### 5.1 BalanceService — 余额核心服务

**文件：`internal/service/balance_service.go`**

```go
package service

import (
    "errors"
    "fmt"
    "time"

    "gorm.io/gorm"
    "gorm.io/gorm/clause"
)

var (
    ErrInsufficientBalance = errors.New("insufficient balance")
    ErrBalanceNotFound     = errors.New("balance record not found")
)

type BalanceService struct {
    cfg *config.BalanceConfig
}

func NewBalanceService(cfg *config.BalanceConfig) *BalanceService {
    return &BalanceService{cfg: cfg}
}
```

#### 5.1.1 获取余额

```go
func (s *BalanceService) GetBalance(userID uint) (*dto.BalanceResponse, error) {
    db := database.GetDB()

    var balance model.UserBalance
    err := db.Where("user_id = ?", userID).First(&balance).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            // 兜底：如果记录不存在则自动创建
            return s.initBalance(db, userID)
        }
        return nil, err
    }

    return &dto.BalanceResponse{
        Balance:        balance.Balance,
        TotalRecharged: balance.TotalRecharged,
        TotalConsumed:  balance.TotalConsumed,
        TotalGifted:    balance.TotalGifted,
    }, nil
}
```

#### 5.1.2 余额检查（对话前调用）

```go
func (s *BalanceService) CheckBalance(userID uint, modelName string) (*dto.BalanceCheckResponse, error) {
    db := database.GetDB()

    var balance model.UserBalance
    if err := db.Where("user_id = ?", userID).First(&balance).Error; err != nil {
        return nil, err
    }

    // 估算单次对话最低消耗（按模型费率 × 最小 token 量）
    estimatedCost := s.estimateMinCost(modelName)

    return &dto.BalanceCheckResponse{
        Sufficient:    balance.Balance >= estimatedCost,
        Balance:       balance.Balance,
        EstimatedCost: estimatedCost,
    }, nil
}

func (s *BalanceService) estimateMinCost(modelName string) int64 {
    for _, m := range s.cfg.Models {
        if m.Name == modelName {
            // 预估最少 500 input + 200 output tokens
            return int64(m.InputPrice)*500/1000 + int64(m.OutputPrice)*200/1000
        }
    }
    return 1 // 至少 1 点
}
```

#### 5.1.3 扣费（核心，事务 + 行级锁）

```go
// Deduct 扣费操作，在 AI 对话完成后调用
// 使用 SELECT ... FOR UPDATE 行级锁保证并发安全
func (s *BalanceService) Deduct(userID uint, points int64, desc string,
    refID string, refType string, metadata map[string]interface{}) error {

    db := database.GetDB()

    return db.Transaction(func(tx *gorm.DB) error {
        // 1. 加行级锁读取余额
        var balance model.UserBalance
        err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
            Where("user_id = ?", userID).
            First(&balance).Error
        if err != nil {
            return fmt.Errorf("查询余额失败: %w", err)
        }

        // 2. 检查余额是否充足
        if balance.Balance < points {
            return ErrInsufficientBalance
        }

        // 3. 扣减余额
        newBalance := balance.Balance - points
        err = tx.Model(&balance).Updates(map[string]interface{}{
            "balance":        newBalance,
            "total_consumed": gorm.Expr("total_consumed + ?", points),
            "updated_at":     time.Now(),
        }).Error
        if err != nil {
            return fmt.Errorf("更新余额失败: %w", err)
        }

        // 4. 写入交易流水
        metaJSON, _ := json.Marshal(metadata)
        txRecord := &model.Transaction{
            UserID:        userID,
            Type:          model.TxTypeConsumption,
            Amount:        -points, // 支出为负数
            BalanceAfter:  newBalance,
            Description:   desc,
            ReferenceID:   refID,
            ReferenceType: refType,
            Metadata:      metaJSON,
        }
        if err := tx.Create(txRecord).Error; err != nil {
            return fmt.Errorf("写入流水失败: %w", err)
        }

        // 5. 检查是否需要发送余额预警
        s.checkLowBalance(tx, userID, newBalance)

        return nil
    })
}
```

#### 5.1.4 入账（充值 / 赠送 / 邀请奖励 通用）

```go
// Credit 入账操作，通用于充值到账、赠送、邀请奖励
func (s *BalanceService) Credit(userID uint, points int64, txType string,
    desc string, refID string, refType string, metadata map[string]interface{}) error {

    db := database.GetDB()

    return db.Transaction(func(tx *gorm.DB) error {
        // 1. 加行级锁读取余额
        var balance model.UserBalance
        err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
            Where("user_id = ?", userID).
            First(&balance).Error
        if err != nil {
            return fmt.Errorf("查询余额失败: %w", err)
        }

        // 2. 增加余额，更新对应累计字段
        newBalance := balance.Balance + points
        updates := map[string]interface{}{
            "balance":    newBalance,
            "updated_at": time.Now(),
        }
        switch txType {
        case model.TxTypeRecharge:
            updates["total_recharged"] = gorm.Expr("total_recharged + ?", points)
        case model.TxTypeGift, model.TxTypeReferral:
            updates["total_gifted"] = gorm.Expr("total_gifted + ?", points)
        case model.TxTypeRefund:
            // 退款减少 total_consumed
            updates["total_consumed"] = gorm.Expr("total_consumed - ?", points)
        }

        err = tx.Model(&balance).Updates(updates).Error
        if err != nil {
            return fmt.Errorf("更新余额失败: %w", err)
        }

        // 3. 写入交易流水
        metaJSON, _ := json.Marshal(metadata)
        txRecord := &model.Transaction{
            UserID:        userID,
            Type:          txType,
            Amount:        points, // 收入为正数
            BalanceAfter:  newBalance,
            Description:   desc,
            ReferenceID:   refID,
            ReferenceType: refType,
            Metadata:      metaJSON,
        }
        return tx.Create(txRecord).Error
    })
}
```

#### 5.1.5 余额预警

```go
// checkLowBalance 在扣费后检查余额，触发系统消息
func (s *BalanceService) checkLowBalance(tx *gorm.DB, userID uint, balance int64) {
    if balance > s.cfg.LowBalanceThreshold {
        return
    }

    // 检查今日是否已发过预警消息（避免重复）
    var count int64
    today := time.Now().Truncate(24 * time.Hour)
    tx.Model(&model.SystemMessage{}).
        Where("user_id = ? AND msg_type = ? AND created_at >= ?",
            userID, "usage", today).
        Count(&count)
    if count > 0 {
        return
    }

    // 生成预警消息
    msg := &model.SystemMessage{
        UserID:  userID,
        Title:   "余额不足提醒",
        Content: fmt.Sprintf(
            "您的账户余额已不足 %d 点，为避免创作中断，建议尽快充值。\n当前余额：%d 点",
            s.cfg.LowBalanceThreshold, balance),
        MsgType: "usage",
        IsRead:  false,
    }
    tx.Create(msg) // 非关键路径，错误不回滚
}
```

#### 5.1.6 交易记录查询

```go
func (s *BalanceService) GetTransactions(userID uint, req *dto.TransactionListRequest) (*dto.TransactionListResponse, error) {
    db := database.GetDB()

    var transactions []model.Transaction
    var total int64

    query := db.Model(&model.Transaction{}).Where("user_id = ?", userID)

    // 类型筛选
    switch req.Type {
    case "recharge":
        query = query.Where("type = ?", model.TxTypeRecharge)
    case "consumption":
        query = query.Where("type = ?", model.TxTypeConsumption)
    case "gift_referral":
        query = query.Where("type IN ?", []string{model.TxTypeGift, model.TxTypeReferral})
    }
    // "all" 或空值不加条件

    // 时间筛选
    days := req.GetDays()
    startDate := time.Now().AddDate(0, 0, -days)
    query = query.Where("created_at >= ?", startDate)

    // 计数
    query.Count(&total)

    // 分页查询
    err := query.
        Order("created_at DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Find(&transactions).Error
    if err != nil {
        return nil, err
    }

    // 转换 DTO
    items := make([]dto.TransactionResponse, len(transactions))
    for i, t := range transactions {
        items[i] = dto.TransactionResponse{
            ID:           t.ID,
            Type:         t.Type,
            Amount:       t.Amount,
            BalanceAfter: t.BalanceAfter,
            Description:  t.Description,
            CreatedAt:    t.CreatedAt,
            Metadata:     t.Metadata,
        }
    }

    return &dto.TransactionListResponse{
        Transactions: items,
        Total:        total,
        Page:         req.GetPage(),
        PageSize:     req.GetPageSize(),
    }, nil
}
```

#### 5.1.7 初始化余额（注册时调用）

```go
// InitBalanceForNewUser 在注册事务中调用
func (s *BalanceService) InitBalanceForNewUser(tx *gorm.DB, userID uint) error {
    giftPoints := s.cfg.InitialGiftPoints

    // 1. 创建余额记录
    balance := &model.UserBalance{
        UserID:      userID,
        Balance:     giftPoints,
        TotalGifted: giftPoints,
    }
    if err := tx.Create(balance).Error; err != nil {
        return err
    }

    // 2. 如果有赠送点数，写入交易流水
    if giftPoints > 0 {
        txRecord := &model.Transaction{
            UserID:       userID,
            Type:         model.TxTypeGift,
            Amount:       giftPoints,
            BalanceAfter: giftPoints,
            Description:  "新用户注册赠送",
        }
        if err := tx.Create(txRecord).Error; err != nil {
            return err
        }
    }

    return nil
}
```

### 5.2 RechargeService — 充值服务

**文件：`internal/service/recharge_service.go`**

```go
package service

var (
    ErrOrderNotFound     = errors.New("order not found")
    ErrOrderAlreadyPaid  = errors.New("order already paid")
    ErrInvalidAmount     = errors.New("invalid recharge amount")
    ErrInvalidSign       = errors.New("invalid payment signature")
    ErrDuplicateCallback = errors.New("duplicate callback")
)

type RechargeService struct {
    cfg            *config.BalanceConfig
    balanceService *BalanceService
}

func NewRechargeService(cfg *config.BalanceConfig, bs *BalanceService) *RechargeService {
    return &RechargeService{cfg: cfg, balanceService: bs}
}
```

#### 5.2.1 获取充值配置

```go
func (s *RechargeService) GetConfig() *dto.RechargeConfigResponse {
    presets := make([]dto.RechargePreset, len(s.cfg.RechargePresets))
    for i, p := range s.cfg.RechargePresets {
        presets[i] = dto.RechargePreset{
            AmountYuan: p.AmountYuan,
            Points:     p.Points,
        }
    }

    return &dto.RechargeConfigResponse{
        ExchangeRate:   s.cfg.ExchangeRate,
        MinAmountYuan:  s.cfg.MinRechargeYuan,
        Presets:        presets,
        PaymentMethods: s.cfg.PaymentMethods,
    }
}
```

#### 5.2.2 创建充值订单

```go
func (s *RechargeService) CreateOrder(userID uint, req *dto.CreateRechargeRequest) (*dto.CreateRechargeResponse, error) {
    // 1. 校验金额
    if req.AmountYuan < s.cfg.MinRechargeYuan {
        return nil, ErrInvalidAmount
    }

    // 2. 计算点数
    points := int64(req.AmountYuan * float64(s.cfg.ExchangeRate))

    // 3. 生成订单号: R + 时间戳 + 用户ID后4位 + 随机数
    orderNo := generateOrderNo(userID)

    // 4. 创建订单记录
    order := &model.RechargeOrder{
        UserID:        userID,
        OrderNo:       orderNo,
        AmountYuan:    req.AmountYuan,
        Points:        points,
        PaymentMethod: req.PaymentMethod,
        Status:        model.OrderStatusPending,
    }

    db := database.GetDB()
    if err := db.Create(order).Error; err != nil {
        return nil, fmt.Errorf("创建订单失败: %w", err)
    }

    // 5. 调用支付平台创建支付（预留接口）
    paymentURL := s.createPayment(order)

    expireAt := order.CreatedAt.Add(
        time.Duration(s.cfg.OrderTimeoutMinutes) * time.Minute)

    return &dto.CreateRechargeResponse{
        OrderNo:       order.OrderNo,
        AmountYuan:    order.AmountYuan,
        Points:        order.Points,
        PaymentMethod: order.PaymentMethod,
        PaymentURL:    paymentURL,
        ExpireAt:      expireAt.Format(time.RFC3339),
    }, nil
}

// generateOrderNo 生成唯一订单号
func generateOrderNo(userID uint) string {
    now := time.Now()
    userSuffix := fmt.Sprintf("%04d", userID%10000)
    random := fmt.Sprintf("%04d", rand.Intn(10000))
    return fmt.Sprintf("R%s%s%s",
        now.Format("20060102150405"), userSuffix, random)
}

// createPayment 调用支付平台（预留，返回模拟 URL）
func (s *RechargeService) createPayment(order *model.RechargeOrder) string {
    // TODO: 对接支付宝/微信支付 SDK
    // 当前返回模拟支付 URL
    return fmt.Sprintf("/pay/mock?order_no=%s", order.OrderNo)
}
```

#### 5.2.3 支付回调处理

幂等性由 `UPDATE WHERE status=0` 原子操作保证，不需要额外的分布式锁：

```go
// HandleCallback 支付平台回调，幂等处理
func (s *RechargeService) HandleCallback(req *dto.PaymentCallbackRequest) error {
    // 1. 验签（实际接入时根据支付平台规则实现）
    if !s.verifySign(req) {
        return ErrInvalidSign
    }

    db := database.GetDB()

    return db.Transaction(func(tx *gorm.DB) error {
        // 2. 原子更新订单状态：UPDATE WHERE status=0
        //    多个重复回调同时到达时，只有一个能命中 status=0 的行
        now := time.Now()
        result := tx.Model(&model.RechargeOrder{}).
            Where("order_no = ? AND status = ?", req.OrderNo, model.OrderStatusPending).
            Updates(map[string]interface{}{
                "status":     model.OrderStatusPaid,
                "paid_at":    now,
                "updated_at": now,
            })
        if result.Error != nil {
            return fmt.Errorf("更新订单失败: %w", result.Error)
        }

        // 3. rows_affected=0 说明订单不存在或已处理，直接返回（幂等）
        if result.RowsAffected == 0 {
            // 区分"不存在"和"已处理"
            var order model.RechargeOrder
            if err := tx.Where("order_no = ?", req.OrderNo).First(&order).Error; err != nil {
                return ErrOrderNotFound
            }
            return nil // 订单已处理，幂等返回成功
        }

        // 4. 查询订单详情用于入账
        var order model.RechargeOrder
        if err := tx.Where("order_no = ?", req.OrderNo).First(&order).Error; err != nil {
            return err
        }

        // 5. 金额校验
        if req.AmountYuan != order.AmountYuan {
            return ErrInvalidAmount
        }

        // 6. 入账（在同一事务内完成）
        return s.creditWithTx(tx, order)
    })
}

// creditWithTx 在事务内完成入账
func (s *RechargeService) creditWithTx(tx *gorm.DB, order model.RechargeOrder) error {
    // 加行级锁更新余额
    var balance model.UserBalance
    err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
        Where("user_id = ?", order.UserID).
        First(&balance).Error
    if err != nil {
        return err
    }

    newBalance := balance.Balance + order.Points
    err = tx.Model(&balance).Updates(map[string]interface{}{
        "balance":          newBalance,
        "total_recharged":  gorm.Expr("total_recharged + ?", order.Points),
        "updated_at":       time.Now(),
    }).Error
    if err != nil {
        return err
    }

    // 写入交易流水
    metadata, _ := json.Marshal(map[string]interface{}{
        "payment_method": order.PaymentMethod,
        "amount_yuan":    fmt.Sprintf("%.2f", order.AmountYuan),
        "order_no":       order.OrderNo,
    })

    txRecord := &model.Transaction{
        UserID:        order.UserID,
        Type:          model.TxTypeRecharge,
        Amount:        order.Points,
        BalanceAfter:  newBalance,
        Description:   fmt.Sprintf("充值 %.2f 元", order.AmountYuan),
        ReferenceID:   order.OrderNo,
        ReferenceType: "order",
        Metadata:      metadata,
    }
    if err := tx.Create(txRecord).Error; err != nil {
        return err
    }

    return nil
}
```

#### 5.2.4 查询订单状态

```go
func (s *RechargeService) GetOrderStatus(userID uint, orderNo string) (*dto.OrderStatusResponse, error) {
    db := database.GetDB()

    var order model.RechargeOrder
    err := db.Where("order_no = ? AND user_id = ?", orderNo, userID).
        First(&order).Error
    if err != nil {
        return nil, ErrOrderNotFound
    }

    statusText := map[int8]string{
        0: "待支付", 1: "已支付", 2: "已取消", 3: "已退款",
    }

    return &dto.OrderStatusResponse{
        OrderNo:    order.OrderNo,
        Status:     order.Status,
        StatusText: statusText[order.Status],
        Points:     order.Points,
        PaidAt:     order.PaidAt,
    }, nil
}
```

#### 5.2.5 过期订单自动取消

```go
// CancelExpiredOrders 定时任务调用，取消超时未支付订单
func (s *RechargeService) CancelExpiredOrders() (int64, error) {
    db := database.GetDB()

    expireTime := time.Now().Add(
        -time.Duration(s.cfg.OrderTimeoutMinutes) * time.Minute)

    result := db.Model(&model.RechargeOrder{}).
        Where("status = ? AND created_at < ?",
            model.OrderStatusPending, expireTime).
        Update("status", model.OrderStatusCancelled)

    return result.RowsAffected, result.Error
}
```

### 5.3 PricingService — 费率服务

**文件：`internal/service/pricing_service.go`**

```go
type PricingService struct {
    cfg *config.BalanceConfig
}

func NewPricingService(cfg *config.BalanceConfig) *PricingService {
    return &PricingService{cfg: cfg}
}

func (s *PricingService) GetPricing() *dto.PricingResponse {
    models := make([]dto.ModelPricingResponse, len(s.cfg.Models))
    for i, m := range s.cfg.Models {
        models[i] = dto.ModelPricingResponse{
            Name:        m.Name,
            DisplayName: m.DisplayName,
            InputPrice:  m.InputPrice,
            OutputPrice: m.OutputPrice,
            Unit:        "1K Tokens",
        }
    }

    return &dto.PricingResponse{
        Models:              models,
        ExchangeRate:        s.cfg.ExchangeRate,
        ExchangeDescription: fmt.Sprintf("1 元 = %d 点", s.cfg.ExchangeRate),
    }
}

// CalculatePoints 根据模型和 token 数计算消耗点数
func (s *PricingService) CalculatePoints(modelName string, inputTokens, outputTokens int) int64 {
    for _, m := range s.cfg.Models {
        if m.Name == modelName {
            inputCost := int64(m.InputPrice) * int64(inputTokens) / 1000
            outputCost := int64(m.OutputPrice) * int64(outputTokens) / 1000
            total := inputCost + outputCost
            if total < 1 {
                total = 1 // 最低消耗 1 点
            }
            return total
        }
    }
    // 未知模型使用标准费率
    return int64(inputTokens)/1000 + int64(outputTokens)*2/1000
}
```

### 5.4 UsageService 扩展 — 会话消费排行

**文件：`internal/service/usage_service.go` — 新增方法**

```go
// GetConversationRanking 按会话统计消费排行
func (s *UsageService) GetConversationRanking(userID uint, req *dto.ConversationRankingRequest) (*dto.ConversationRankingResponse, error) {
    db := database.GetDB()

    startDate := time.Now().AddDate(0, 0, -req.GetDays())

    // 子查询：按会话聚合 token_usage
    var results []struct {
        ConversationID uint
        TotalPoints    int64
        TotalTokens    int64
        MessageCount   int64
        LastUsedAt     time.Time
    }

    var total int64

    baseQuery := db.Model(&model.TokenUsage{}).
        Select(`conversation_id,
                COALESCE(SUM(points_consumed), 0) as total_points,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COUNT(*) as message_count,
                MAX(created_at) as last_used_at`).
        Where("user_id = ? AND created_at >= ?", userID, startDate).
        Group("conversation_id")

    // 总数
    db.Table("(?) as sub", baseQuery).Count(&total)

    // 分页查询
    err := baseQuery.
        Order("total_points DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Scan(&results).Error
    if err != nil {
        return nil, err
    }

    // 查询会话标题（从 chat_schema.conversations）
    convIDs := make([]uint, len(results))
    for i, r := range results {
        convIDs[i] = r.ConversationID
    }

    titleMap := s.getConversationTitles(db, convIDs)

    // 组装响应
    items := make([]dto.ConversationUsageResponse, len(results))
    for i, r := range results {
        items[i] = dto.ConversationUsageResponse{
            ConversationID: r.ConversationID,
            Title:          titleMap[r.ConversationID],
            TotalPoints:    r.TotalPoints,
            TotalTokens:    r.TotalTokens,
            MessageCount:   r.MessageCount,
            LastUsedAt:     r.LastUsedAt,
        }
    }

    return &dto.ConversationRankingResponse{
        Conversations: items,
        Total:         total,
        Page:          req.GetPage(),
        PageSize:      req.GetPageSize(),
    }, nil
}

// getConversationTitles 从 chat_schema 查询会话标题
func (s *UsageService) getConversationTitles(db *gorm.DB, ids []uint) map[uint]string {
    if len(ids) == 0 {
        return map[uint]string{}
    }

    type convTitle struct {
        ID    uint
        Title string
    }
    var titles []convTitle
    db.Table("chat_schema.conversations").
        Select("id, title").
        Where("id IN ?", ids).
        Scan(&titles)

    m := make(map[uint]string, len(titles))
    for _, t := range titles {
        m[t.ID] = t.Title
    }
    return m
}

// GetDailyUsageExtended 扩展的每日用量（含点数维度）
func (s *UsageService) GetDailyUsageExtended(userID uint, days int) ([]dto.DailyUsageExtendedResponse, error) {
    db := database.GetDB()

    startDate := time.Now().AddDate(0, 0, -days)

    var results []struct {
        Date           string
        InputTokens    int64
        OutputTokens   int64
        TotalTokens    int64
        PointsConsumed int64
    }

    err := db.Model(&model.TokenUsage{}).
        Select(`DATE(created_at) as date,
                SUM(input_tokens) as input_tokens,
                SUM(output_tokens) as output_tokens,
                SUM(total_tokens) as total_tokens,
                COALESCE(SUM(points_consumed), 0) as points_consumed`).
        Where("user_id = ? AND created_at >= ?", userID, startDate).
        Group("DATE(created_at)").
        Order("date ASC").
        Scan(&results).Error
    if err != nil {
        return nil, err
    }

    items := make([]dto.DailyUsageExtendedResponse, len(results))
    for i, r := range results {
        items[i] = dto.DailyUsageExtendedResponse{
            Date:           r.Date,
            InputTokens:    r.InputTokens,
            OutputTokens:   r.OutputTokens,
            TotalTokens:    r.TotalTokens,
            PointsConsumed: r.PointsConsumed,
        }
    }

    return items, nil
}
```

### 5.5 充值返利

**文件：`internal/service/balance_service.go` — 追加方法**

> 注意：注册时不再给推荐人发放奖励（原 `HandleReferralReward` 已删除）。返利仅在充值时触发。

```go
// grantRechargeReferralBonus 充值返利：每次充值都给推荐人发放返利（同步调用）
// 在 recharge_service.go 的 HandleCallback 事务成功后同步调用
func (s *BalanceService) grantRechargeReferralBonus(userID uint, rechargePoints int64, orderNo string) {
    db := database.GetDB()

    // 检查是否有推荐人
    var referral model.Referral
    err := db.Where("referee_id = ?", userID).First(&referral).Error
    if err != nil {
        return
    }

    // 计算奖励
    bonusRate := s.cfg.Referral.FirstRechargeBonusRate
    bonus := rechargePoints * int64(bonusRate) / 100
    if bonus <= 0 {
        return
    }

    // 给推荐人发放（Credit 自带独立事务）
    if err := s.Credit(referral.ReferrerID, bonus, model.TxTypeReferral,
        "被邀请用户充值返利",
        orderNo, "recharge_referral",
        map[string]interface{}{
            "referee_id":      userID,
            "recharge_points": rechargePoints,
            "bonus_rate":      bonusRate,
            "order_no":        orderNo,
        }); err != nil {
        log.Printf("[RechargeReferralBonus] userID=%d orderNo=%s error: %v", userID, orderNo, err)
    }
}
```

---

## 6. Handler 层设计

### 6.1 BalanceHandler

**文件：`internal/handler/balance_handler.go`**

```go
package handler

var balanceService *service.BalanceService

func InitBalanceService(cfg *config.BalanceConfig) {
    balanceService = service.NewBalanceService(cfg)
}

// GetBalance GET /api/v1/balance
func GetBalance(c *gin.Context) {
    userID := c.GetUint("userID")

    result, err := balanceService.GetBalance(userID)
    if err != nil {
        utils.InternalError(c, "获取余额失败")
        return
    }

    utils.Success(c, result)
}

// CheckBalance GET /api/v1/balance/check?model=standard
func CheckBalance(c *gin.Context) {
    userID := c.GetUint("userID")
    modelName := c.DefaultQuery("model", "standard")

    result, err := balanceService.CheckBalance(userID, modelName)
    if err != nil {
        utils.InternalError(c, "余额检查失败")
        return
    }

    utils.Success(c, result)
}

// GetTransactions GET /api/v1/transactions
func GetTransactions(c *gin.Context) {
    userID := c.GetUint("userID")

    var req dto.TransactionListRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        utils.BadRequest(c, "参数错误")
        return
    }

    result, err := balanceService.GetTransactions(userID, &req)
    if err != nil {
        utils.InternalError(c, "获取交易记录失败")
        return
    }

    utils.Success(c, result)
}
```

### 6.2 RechargeHandler

**文件：`internal/handler/recharge_handler.go`**

```go
package handler

var rechargeService *service.RechargeService

func InitRechargeService(cfg *config.BalanceConfig, bs *service.BalanceService) {
    rechargeService = service.NewRechargeService(cfg, bs)
}

// GetRechargeConfig GET /api/v1/recharge/config
func GetRechargeConfig(c *gin.Context) {
    result := rechargeService.GetConfig()
    utils.Success(c, result)
}

// CreateRechargeOrder POST /api/v1/recharge/create
func CreateRechargeOrder(c *gin.Context) {
    userID := c.GetUint("userID")

    var req dto.CreateRechargeRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.BadRequest(c, "参数错误")
        return
    }

    result, err := rechargeService.CreateOrder(userID, &req)
    if err != nil {
        switch {
        case errors.Is(err, service.ErrInvalidAmount):
            utils.BadRequest(c, fmt.Sprintf("充值金额不能低于 %.0f 元",
                rechargeService.GetConfig().MinAmountYuan))
        default:
            utils.InternalError(c, "创建订单失败")
        }
        return
    }

    utils.Success(c, result)
}

// PaymentCallback POST /api/v1/recharge/callback
// 注意：此接口不需要 JWT 认证，由支付平台回调
func PaymentCallback(c *gin.Context) {
    var req dto.PaymentCallbackRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.BadRequest(c, "参数错误")
        return
    }

    err := rechargeService.HandleCallback(&req)
    if err != nil {
        switch {
        case errors.Is(err, service.ErrInvalidSign):
            utils.BadRequest(c, "签名验证失败")
        case errors.Is(err, service.ErrOrderNotFound):
            utils.NotFound(c, "订单不存在")
        default:
            utils.InternalError(c, "回调处理失败")
        }
        return
    }

    utils.SuccessMessage(c, "success")
}

// GetOrderStatus GET /api/v1/recharge/status/:order_no
func GetOrderStatus(c *gin.Context) {
    userID := c.GetUint("userID")
    orderNo := c.Param("order_no")

    result, err := rechargeService.GetOrderStatus(userID, orderNo)
    if err != nil {
        if errors.Is(err, service.ErrOrderNotFound) {
            utils.NotFound(c, "订单不存在")
            return
        }
        utils.InternalError(c, "查询订单失败")
        return
    }

    utils.Success(c, result)
}
```

### 6.3 PricingHandler

**文件：`internal/handler/pricing_handler.go`**

```go
package handler

var pricingService *service.PricingService

func InitPricingService(cfg *config.BalanceConfig) {
    pricingService = service.NewPricingService(cfg)
}

// GetPricing GET /api/v1/pricing
func GetPricing(c *gin.Context) {
    result := pricingService.GetPricing()
    utils.Success(c, result)
}
```

### 6.4 UsageHandler 扩展

**文件：`internal/handler/usage_handler.go` — 新增方法**

```go
// GetConversationRanking GET /api/v1/usage/conversations
func GetConversationRanking(c *gin.Context) {
    userID := c.GetUint("userID")

    var req dto.ConversationRankingRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        utils.BadRequest(c, "参数错误")
        return
    }

    result, err := usageService.GetConversationRanking(userID, &req)
    if err != nil {
        utils.InternalError(c, "获取会话消费排行失败")
        return
    }

    utils.Success(c, result)
}

// GetDailyUsageExtended GET /api/v1/usage/daily（扩展版，含点数）
// 覆盖原有 GetDailyUsage，新增 points_consumed 字段
func GetDailyUsageExtended(c *gin.Context) {
    userID := c.GetUint("userID")

    days := 30
    if d := c.Query("days"); d != "" {
        if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 365 {
            days = parsed
        }
    }

    daily, err := usageService.GetDailyUsageExtended(userID, days)
    if err != nil {
        utils.InternalError(c, "获取每日用量失败")
        return
    }

    utils.Success(c, gin.H{
        "daily": daily,
        "days":  days,
    })
}
```

---

## 7. 路由注册

**文件：`cmd/server/main.go` — 新增路由组**

```go
func setupRoutes(r *gin.Engine, cfg *config.Config) {
    api := r.Group("/api/v1")

    // ... 现有路由 ...

    // ========== 新增路由 ==========

    // 初始化服务
    handler.InitBalanceService(&cfg.Balance)
    handler.InitRechargeService(&cfg.Balance, handler.GetBalanceService())
    handler.InitPricingService(&cfg.Balance)

    // 余额路由（需认证）
    balance := api.Group("/balance")
    balance.Use(middleware.Auth())
    {
        balance.GET("", handler.GetBalance)
        balance.GET("/check", handler.CheckBalance)
    }

    // 交易记录路由（需认证）
    transactions := api.Group("/transactions")
    transactions.Use(middleware.Auth())
    {
        transactions.GET("", handler.GetTransactions)
    }

    // 充值路由
    recharge := api.Group("/recharge")
    {
        // 需认证的接口
        recharge.Use(middleware.Auth())
        recharge.GET("/config", handler.GetRechargeConfig)
        recharge.POST("/create", handler.CreateRechargeOrder)
        recharge.GET("/status/:order_no", handler.GetOrderStatus)
    }
    // 支付回调不需要 JWT 认证（由支付平台调用）
    api.POST("/recharge/callback", handler.PaymentCallback)

    // 费率路由（需认证）
    pricing := api.Group("/pricing")
    pricing.Use(middleware.Auth())
    {
        pricing.GET("", handler.GetPricing)
    }

    // 扩展现有 usage 路由
    // usage.GET("/conversations", handler.GetConversationRanking) ← 新增
    // usage.GET("/daily") ← 替换为 GetDailyUsageExtended
}
```

---

## 8. Redis 使用说明

### 8.1 设计原则

账户余额系统的**所有核心逻辑（扣费、入账、回调幂等）完全由 PostgreSQL 事务 + 行级锁保证**，不依赖 Redis。Redis 仅作为可选的读缓存优化，不可用时系统功能完全正常。

### 8.2 可选缓存：余额查询

高频场景（如前端页面反复请求余额）可通过 Redis 缓存减少 DB 查询：

| Key 格式 | 数据 | TTL | 说明 |
|----------|------|-----|------|
| `balance:{user_id}` | BalanceResponse JSON | 60s | 余额快查，写操作时主动失效 |

```go
func (s *BalanceService) GetBalance(userID uint) (*dto.BalanceResponse, error) {
    redis := database.GetRedis()

    // 1. 尝试读缓存（Redis 不可用时跳过）
    if redis != nil {
        key := fmt.Sprintf("balance:%d", userID)
        cached, err := redis.Get(context.Background(), key).Result()
        if err == nil {
            var resp dto.BalanceResponse
            if json.Unmarshal([]byte(cached), &resp) == nil {
                return &resp, nil
            }
        }
    }

    // 2. 查数据库（user_id 唯一索引，毫秒级）
    resp, err := s.getBalanceFromDB(userID)
    if err != nil {
        return nil, err
    }

    // 3. 写回缓存
    if redis != nil {
        data, _ := json.Marshal(resp)
        key := fmt.Sprintf("balance:%d", userID)
        redis.Set(context.Background(), key, data, 60*time.Second)
    }

    return resp, nil
}

// InvalidateBalanceCache 余额变更时失效缓存
func (s *BalanceService) InvalidateBalanceCache(userID uint) {
    if redis := database.GetRedis(); redis != nil {
        redis.Del(context.Background(), fmt.Sprintf("balance:%d", userID))
    }
}
```

### 8.3 不使用 Redis 的场景

| 场景 | 为什么不用 Redis | 正确做法 |
|------|----------------|---------|
| 充值/费率配置缓存 | 数据来自 `config.yaml`，本身就在内存中 | 直接读 `BalanceConfig` 结构体 |
| 支付回调防重 | DB 行级锁 + `UPDATE WHERE status=0` 已保证幂等 | 见 5.2.3 节事务设计 |
| 扣费并发控制 | `SELECT ... FOR UPDATE` 行级锁已序列化同用户操作 | 见 5.1.3 节事务设计 |

---

## 9. 对话扣费集成点

### 9.1 扣费时机

AI 对话回复完成后，算法后端通过 BFF 写入 `token_usage` 记录时，同步完成扣费：

```
用户发送消息 → BFF 转发 → 算法后端处理
                              │
                              ▼
              算法后端返回响应 + token 用量
                              │
                              ▼
              BFF 接收到 token_usage 数据
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           写入 token_usage 表    计算点数 → 扣费
                                        │
                                        ▼
                              更新 user_balance
                              写入 transactions
                              检查余额预警
```

### 9.2 扣费伪代码

```go
// 在 chat 消息处理流程中调用
func onAIResponseComplete(userID uint, convID uint, msgID uint,
    inputTokens, outputTokens int, modelName string) error {

    // 1. 计算消耗点数
    points := pricingService.CalculatePoints(modelName, inputTokens, outputTokens)

    // 2. 写入 token_usage（含 points_consumed）
    usage := &model.TokenUsage{
        UserID:         userID,
        ConversationID: convID,
        MessageID:      msgID,
        InputTokens:    inputTokens,
        OutputTokens:   outputTokens,
        TotalTokens:    inputTokens + outputTokens,
        Model:          modelName,
        PointsConsumed: points,
    }
    db.Create(usage)

    // 3. 扣费
    metadata := map[string]interface{}{
        "conversation_id":    convID,
        "conversation_title": getConvTitle(convID),
        "model":              modelName,
        "input_tokens":       inputTokens,
        "output_tokens":      outputTokens,
    }
    err := balanceService.Deduct(userID, points,
        getConvTitle(convID),                           // description
        fmt.Sprintf("%d", msgID),                       // reference_id
        "message",                                      // reference_type
        metadata)

    if err != nil {
        if errors.Is(err, service.ErrInsufficientBalance) {
            // 通过 WebSocket 通知前端余额不足
            notifyInsufficientBalance(userID)
        }
        return err
    }

    // 4. 失效余额缓存
    balanceService.InvalidateBalanceCache(userID)

    return nil
}
```

---

## 10. 定时任务

### 10.1 任务列表

| 任务 | 频率 | 说明 |
|------|------|------|
| 取消过期订单 | 每 5 分钟 | 取消超过 30 分钟未支付的订单 |
| 清理旧交易记录 | 每天凌晨 | 可选，归档 180 天前的交易明细到冷存储 |

### 10.2 实现方式

使用 Go 的 `time.Ticker` 在应用启动时注册：

```go
// cmd/server/main.go
func startScheduledTasks(rechargeService *service.RechargeService) {
    // 每 5 分钟取消过期订单
    go func() {
        ticker := time.NewTicker(5 * time.Minute)
        defer ticker.Stop()
        for range ticker.C {
            count, err := rechargeService.CancelExpiredOrders()
            if err != nil {
                log.Printf("取消过期订单失败: %v", err)
            } else if count > 0 {
                log.Printf("已取消 %d 个过期订单", count)
            }
        }
    }()
}
```

---

## 11. API 接口汇总

### 11.1 需认证接口

| 方法 | 路径 | Handler | 说明 |
|------|------|---------|------|
| GET | `/api/v1/balance` | GetBalance | 获取余额 |
| GET | `/api/v1/balance/check` | CheckBalance | 检查余额是否充足 |
| GET | `/api/v1/transactions` | GetTransactions | 交易记录（分页+筛选） |
| GET | `/api/v1/recharge/config` | GetRechargeConfig | 充值配置 |
| POST | `/api/v1/recharge/create` | CreateRechargeOrder | 创建充值订单 |
| GET | `/api/v1/recharge/status/:order_no` | GetOrderStatus | 查询订单状态 |
| GET | `/api/v1/pricing` | GetPricing | 模型费率 |
| GET | `/api/v1/usage/conversations` | GetConversationRanking | 会话消费排行 |
| GET | `/api/v1/usage/daily` | GetDailyUsageExtended | 每日用量（扩展） |

### 11.2 无需认证接口

| 方法 | 路径 | Handler | 说明 |
|------|------|---------|------|
| POST | `/api/v1/recharge/callback` | PaymentCallback | 支付平台回调 |

### 11.3 请求/响应示例

详见 PRD 文档第 6.6 节，此处不再重复。所有接口响应格式统一使用 `utils.Response`：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

---

## 12. 并发安全设计

### 12.1 余额操作并发安全

全部由 PostgreSQL 保证，不依赖 Redis：

| 场景 | 保护机制 | 实现方式 |
|------|----------|----------|
| 并发扣费 | 数据库行级锁 | `SELECT ... FOR UPDATE` on `user_balance` |
| 并发充值到账 | 数据库行级锁 | 同上 |
| 重复支付回调 | 原子 UPDATE + 幂等 | `UPDATE WHERE status=0`，`rows_affected=0` 时视为已处理 |
| 多 BFF 实例并发 | 数据库事务 | PostgreSQL 行级锁跨连接生效，天然支持多实例 |

### 12.2 事务隔离级别

所有余额变更操作在 `db.Transaction` 内执行，配合 `FOR UPDATE` 行级锁：

```go
tx.Clauses(clause.Locking{Strength: "UPDATE"}).
    Where("user_id = ?", userID).
    First(&balance)
```

这确保了同一用户的并发余额操作被序列化执行，不会出现超扣或重复入账。

---

## 13. 错误码扩展

**文件：`internal/utils/response.go` — 新增错误码**

```go
const (
    // ... 现有错误码 ...

    // 余额相关 2001-2099
    CodeInsufficientBalance = 2001  // 余额不足
    CodeInvalidAmount       = 2002  // 无效金额
    CodeOrderNotFound       = 2003  // 订单不存在
    CodeOrderAlreadyPaid    = 2004  // 订单已支付
    CodePaymentFailed       = 2005  // 支付失败
    CodeInvalidSign         = 2006  // 签名验证失败
)
```

---

## 14. 注册流程改造

**文件：`internal/service/auth_service.go` — Register 事务扩展**

在现有注册事务中，增加余额初始化和邀请奖励：

```go
err = db.Transaction(func(tx *gorm.DB) error {
    // 1. 创建用户 (已有)
    if err := tx.Create(user).Error; err != nil {
        return err
    }

    // 2. 创建用户偏好 (已有)
    if err := tx.Create(pref).Error; err != nil {
        return err
    }

    // 3. 创建推荐关系 (已有)
    if referrerID > 0 {
        if err := tx.Create(referral).Error; err != nil {
            return err
        }
    }

    // 4. 发送欢迎消息 (已有)
    if err := tx.Create(welcomeMsg).Error; err != nil {
        return err
    }

    // ===== 新增 =====

    // 5. 初始化余额 + 赠送初始点数
    if err := balanceService.InitBalanceForNewUser(tx, user.ID); err != nil {
        return err
    }

    // 注：注册时不再给推荐人发放奖励（HandleReferralReward 已删除）
    // 推荐人返利改为在充值时由 grantRechargeReferralBonus 触发

    return nil
})
```

---

## 15. 开发任务拆分

### Phase 1：数据层与配置 (1-2 天) ✅

- [x] `internal/model/balance.go` — 三个新模型
- [x] `internal/model/message.go` — TokenUsage 新增 PointsConsumed
- [x] `internal/database/database.go` — AutoMigrate + 索引
- [x] `internal/config/config.go` — BalanceConfig 结构体
- [x] `config.yaml` — 新增 balance 配置段
- [x] `internal/dto/balance.go` — 所有 DTO

### Phase 2：余额核心服务 (2-3 天) ✅

- [x] `internal/service/balance_service.go` — GetBalance、Deduct、Credit、InitBalance
- [x] `internal/service/pricing_service.go` — GetPricing、CalculatePoints
- [x] 余额预警消息生成
- [x] 可选：Redis 余额查询缓存（非必须，按需启用）

### Phase 3：充值服务 (2-3 天) ✅

- [x] `internal/service/recharge_service.go` — 创建订单、回调处理、状态查询
- [x] 订单号生成逻辑
- [x] 支付回调幂等处理
- [x] 过期订单定时清理

### Phase 4：Handler 与路由 (1-2 天) ✅

- [x] `internal/handler/balance_handler.go`
- [x] `internal/handler/recharge_handler.go`
- [x] `internal/handler/pricing_handler.go`
- [x] `cmd/server/main.go` — 路由注册
- [x] 错误码扩展

### Phase 5：集成与扩展 (2-3 天) ✅

- [x] `internal/service/auth_service.go` — 注册流程加入余额初始化
- [x] `internal/service/usage_service.go` — 会话排行 + 每日用量扩展
- [x] `internal/handler/usage_handler.go` — 新增接口
- [x] 对话扣费集成（chat 流程接入）
- [x] 邀请返利完整流程

### Phase 6：测试 (1-2 天) ✅

- [x] 单元测试：CalculatePoints、generateOrderNo
- [x] 集成测试：扣费并发安全
- [x] 接口测试：所有 API curl 验证
- [x] 边界场景：余额为 0、重复回调、过期订单

---

## 16. 测试用例

```bash
TOKEN="your_access_token"

# 1. 获取余额
curl -X GET "http://localhost:8080/api/v1/balance" \
  -H "Authorization: Bearer $TOKEN"

# 2. 余额检查
curl -X GET "http://localhost:8080/api/v1/balance/check?model=standard" \
  -H "Authorization: Bearer $TOKEN"

# 3. 获取交易记录（消费类型，近7天）
curl -X GET "http://localhost:8080/api/v1/transactions?type=consumption&days=7&page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN"

# 4. 获取充值配置
curl -X GET "http://localhost:8080/api/v1/recharge/config" \
  -H "Authorization: Bearer $TOKEN"

# 5. 创建充值订单
curl -X POST "http://localhost:8080/api/v1/recharge/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount_yuan": 50, "payment_method": "alipay"}'

# 6. 查询订单状态
curl -X GET "http://localhost:8080/api/v1/recharge/status/R20260206143000001" \
  -H "Authorization: Bearer $TOKEN"

# 7. 获取费率
curl -X GET "http://localhost:8080/api/v1/pricing" \
  -H "Authorization: Bearer $TOKEN"

# 8. 会话消费排行
curl -X GET "http://localhost:8080/api/v1/usage/conversations?days=30&page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN"

# 9. 每日用量（扩展版，含点数）
curl -X GET "http://localhost:8080/api/v1/usage/daily?days=7" \
  -H "Authorization: Bearer $TOKEN"

# 10. 支付回调（无需认证）
curl -X POST "http://localhost:8080/api/v1/recharge/callback" \
  -H "Content-Type: application/json" \
  -d '{"order_no":"R20260206143000001","trade_no":"T123456","amount_yuan":50,"status":"success","payment_method":"alipay","sign":"xxx"}'
```

---

文档版本：1.0
创建时间：2026-02-06
作者：Claude
