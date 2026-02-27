# 管理后台 — 后端技术方案

> 基于 PRD（docs/prd/admin-panel.md）设计，遵循现有 BFF 分层架构（Handler → Service → Model），复用 Gin + GORM 技术栈。在同一个 BFF 服务中新增 `/api/admin/*` 路由组，通过 AdminMiddleware 鉴权。

---

## 1. 技术架构概述

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Middleware Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ CORS         │  │ RateLimiter  │  │ Auth + AdminMiddleware  │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬────────────┘   │
└─────────┼─────────────────┼───────────────────────┼─────────────────┘
          │                 │                       │
          ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Handler Layer (/api/admin/*)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │dashboard_h   │  │admin_user_h  │  │admin_order_h │              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │admin_tx_h    │  │announce_h    │  │admin_config_h│              │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤              │
│  │audit_log_h   │  │              │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Service Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │dashboard_svc │  │admin_user_svc│  │admin_order_sv│              │
│  │              │  │              │  │              │              │
│  │ - GetStats   │  │ - ListUsers  │  │ - ListOrders │              │
│  │ - GetTrends  │  │ - GetDetail  │  │ - GetSummary │              │
│  │ - RecentLogs │  │ - Ban/Unban  │  │              │              │
│  └──────────────┘  │ - AdjustBal  │  └──────────────┘              │
│                    │ - ResetPwd   │                                  │
│  ┌──────────────┐  └──────────────┘  ┌──────────────┐              │
│  │announce_svc  │                    │config_svc    │              │
│  │              │  ┌──────────────┐  │              │              │
│  │ - List       │  │audit_log_svc│  │ - GetAll     │              │
│  │ - Create     │  │              │  │ - BatchUpdate│              │
│  │ - Delete     │  │ - List       │  │              │              │
│  └──────────────┘  │ - GetDetail  │  └──────────────┘              │
│                    │ - Record     │                                  │
│                    └──────────────┘                                  │
│  复用: BalanceService.Credit / Deduct (调账)                         │
│  复用: MessageService (公告 → system_messages)                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Layer                                      │
│  ┌──────────┐  ┌───────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  User     │  │ AdminAuditLog │  │ SystemConfig│  │ 已有表     │ │
│  │(+role)    │  │  (新增)       │  │  (新增)     │  │            │ │
│  └──────────┘  └───────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  PostgreSQL (bff_schema)                 Redis                       │
│  ┌──────────────────────────┐      ┌──────────────────────────┐    │
│  │ users (+role 字段)       │      │ config:* (配置缓存)       │    │
│  │ admin_audit_logs (新增)  │      │                          │    │
│  │ system_configs (新增)    │      │                          │    │
│  │ user_balance (已有)      │      │                          │    │
│  │ transactions (已有)      │      │                          │    │
│  │ recharge_orders (已有)   │      │                          │    │
│  │ system_messages (已有)   │      │                          │    │
│  └──────────────────────────┘      └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 新增文件清单

```
bff/internal/
├── model/
│   ├── user.go                    # 修改：User 新增 Role 字段
│   └── admin.go                   # 新增：AdminAuditLog、SystemConfig 模型
├── dto/
│   └── admin.go                   # 新增：管理端全部 DTO
├── handler/
│   ├── admin_dashboard_handler.go # 新增：仪表盘接口
│   ├── admin_user_handler.go      # 新增：用户管理接口
│   ├── admin_order_handler.go     # 新增：订单 + 交易管理接口
│   ├── admin_announce_handler.go  # 新增：公告管理接口
│   ├── admin_config_handler.go    # 新增：系统配置接口
│   └── admin_audit_handler.go     # 新增：操作日志接口
├── service/
│   ├── admin_dashboard_service.go # 新增：仪表盘统计
│   ├── admin_user_service.go      # 新增：用户管理业务
│   ├── admin_order_service.go     # 新增：订单 + 交易查询
│   ├── admin_announce_service.go  # 新增：公告管理业务
│   ├── admin_config_service.go    # 新增：系统配置业务
│   └── admin_audit_service.go     # 新增：操作日志业务
├── middleware/
│   └── admin.go                   # 新增：AdminMiddleware
└── utils/
    └── response.go                # 修改：新增管理端错误码
```

### 1.3 现有文件变更

| 文件 | 变更内容 |
|------|----------|
| `internal/model/user.go` | User 结构体新增 `Role` 字段 |
| `internal/database/database.go` | AutoMigrate 新增 AdminAuditLog、SystemConfig；新增索引 |
| `internal/utils/jwt.go` | TokenClaims 新增 `Role` 字段；签发时写入角色 |
| `internal/service/auth_service.go` | Login 返回值包含 role；Register 默认 role='user' |
| `internal/utils/response.go` | 新增管理端错误码 (3001-3099) |
| `cmd/server/main.go` | 注册 `/api/admin/*` 路由组；初始化管理端 Service |

---

## 2. 数据模型

### 2.1 现有模型改造

**文件：`internal/model/user.go` — User 新增 Role 字段**

```go
type User struct {
    ID            uint           `gorm:"primaryKey" json:"id"`
    Email         string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
    PasswordHash  string         `gorm:"size:255;not null" json:"-"`
    Nickname      string         `gorm:"size:50" json:"nickname"`
    AvatarURL     string         `gorm:"size:500" json:"avatar_url"`
    EmailVerified bool           `gorm:"default:false" json:"email_verified"`
    InviteCode    string         `gorm:"uniqueIndex;size:20;not null" json:"invite_code"`
    Status        int8           `gorm:"default:1" json:"status"`
    Role          string         `gorm:"size:20;not null;default:'user'" json:"role"` // ← 新增
    CreatedAt     time.Time      `json:"created_at"`
    UpdatedAt     time.Time      `json:"updated_at"`
    DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// 角色常量
const (
    RoleUser       = "user"
    RoleAdmin      = "admin"
    RoleSuperAdmin = "super_admin"
)

// IsAdmin 判断是否为管理员
func (u *User) IsAdmin() bool {
    return u.Role == RoleAdmin || u.Role == RoleSuperAdmin
}
```

**数据库迁移（首次）：**

```sql
ALTER TABLE bff_schema.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_users_role ON bff_schema.users(role);

-- 手动设置首个管理员
UPDATE bff_schema.users SET role = 'admin' WHERE email = 'admin@gennovel.com';
```

### 2.2 新增模型

**文件：`internal/model/admin.go`**

```go
package model

import (
    "time"
    "gorm.io/datatypes"
)

// AdminAuditLog 管理操作审计日志
type AdminAuditLog struct {
    ID         uint           `gorm:"primaryKey" json:"id"`
    AdminID    uint           `gorm:"not null;index" json:"admin_id"`
    Action     string         `gorm:"size:50;not null;index" json:"action"`
    TargetType string         `gorm:"size:30;not null" json:"target_type"`
    TargetID   string         `gorm:"size:100" json:"target_id"`
    Detail     datatypes.JSON `gorm:"type:jsonb" json:"detail"`
    IPAddress  string         `gorm:"size:45" json:"ip_address"`
    CreatedAt  time.Time      `gorm:"index" json:"created_at"`
}

func (AdminAuditLog) TableName() string {
    return "bff_schema.admin_audit_logs"
}

// SystemConfig 系统运行时配置
type SystemConfig struct {
    ID          uint           `gorm:"primaryKey" json:"id"`
    ConfigKey   string         `gorm:"uniqueIndex;size:100;not null" json:"config_key"`
    ConfigValue datatypes.JSON `gorm:"type:jsonb;not null" json:"config_value"`
    Description string         `gorm:"size:200" json:"description"`
    UpdatedBy   uint           `json:"updated_by"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
}

func (SystemConfig) TableName() string {
    return "bff_schema.system_configs"
}

// 操作类型常量
const (
    AuditUserDisable      = "user.disable"
    AuditUserEnable       = "user.enable"
    AuditUserResetPwd     = "user.reset_password"
    AuditUserAdjustBal    = "user.adjust_balance"
    AuditOrderRefund      = "order.refund"
    AuditMsgBroadcast     = "message.broadcast"
    AuditMsgDelete        = "message.delete"
    AuditConfigUpdate     = "config.update"
)

// 操作对象类型常量
const (
    TargetTypeUser    = "user"
    TargetTypeOrder   = "order"
    TargetTypeMessage = "message"
    TargetTypeConfig  = "config"
)

// 操作类型中文标签
var AuditActionLabels = map[string]string{
    AuditUserDisable:   "封禁用户",
    AuditUserEnable:    "解封用户",
    AuditUserResetPwd:  "重置密码",
    AuditUserAdjustBal: "手动调账",
    AuditOrderRefund:   "订单退款",
    AuditMsgBroadcast:  "群发公告",
    AuditMsgDelete:     "删除公告",
    AuditConfigUpdate:  "修改配置",
}
```

### 2.3 数据库迁移与索引

**文件：`internal/database/database.go` — InitSchema 扩展**

```go
func InitSchema() error {
    // ... 现有逻辑 ...

    err := DB.AutoMigrate(
        // 现有模型
        &model.User{},
        &model.UserPreference{},
        &model.Referral{},
        &model.SystemMessage{},
        &model.TokenUsage{},
        &model.UserBalance{},
        &model.Transaction{},
        &model.RechargeOrder{},
        // 新增模型
        &model.AdminAuditLog{},
        &model.SystemConfig{},
    )
    // ...
}
```

**新增索引**（追加到 `createAdditionalIndexes`）：

```go
// admin_audit_logs
`CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id
 ON bff_schema.admin_audit_logs(admin_id)`,
`CREATE INDEX IF NOT EXISTS idx_audit_logs_action
 ON bff_schema.admin_audit_logs(action)`,
`CREATE INDEX IF NOT EXISTS idx_audit_logs_target
 ON bff_schema.admin_audit_logs(target_type, target_id)`,
`CREATE INDEX IF NOT EXISTS idx_audit_logs_time
 ON bff_schema.admin_audit_logs(created_at DESC)`,

// system_configs
`CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configs_key
 ON bff_schema.system_configs(config_key)`,

// users - role 索引
`CREATE INDEX IF NOT EXISTS idx_users_role
 ON bff_schema.users(role)`,
```

---

## 3. JWT 改造

### 3.1 TokenClaims 新增 Role

**文件：`internal/utils/jwt.go` — 修改**

```go
type TokenClaims struct {
    UserID    uint   `json:"user_id"`
    Email     string `json:"email"`
    TokenType string `json:"token_type"` // access / refresh
    Role      string `json:"role"`       // ← 新增
    jwt.RegisteredClaims
}

// GenerateAccessToken 签发 Token 时写入 role
func GenerateAccessToken(userID uint, email string, role string) (string, error) {
    claims := TokenClaims{
        UserID:    userID,
        Email:     email,
        TokenType: "access",
        Role:      role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenExpiry)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}
```

### 3.2 Auth Middleware 扩展

**文件：`internal/middleware/auth.go` — 修改**

在现有 Auth 中间件中，将 role 也写入 gin Context：

```go
func Auth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // ... 现有 JWT 验证逻辑 ...

        claims, err := utils.ValidateToken(tokenString)
        if err != nil { /* ... */ }

        c.Set("userID", claims.UserID)
        c.Set("email", claims.Email)
        c.Set("role", claims.Role)    // ← 新增
        c.Next()
    }
}
```

### 3.3 Login 返回 role

**文件：`internal/service/auth_service.go` — Login 方法修改**

登录接口返回的用户信息中包含 `role` 字段：

```go
func (s *AuthService) Login(req *dto.LoginRequest) (*dto.LoginResponse, error) {
    // ... 现有验证逻辑 ...

    // 签发 Token 时传入 role
    accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, user.Role)

    return &dto.LoginResponse{
        Token: accessToken,
        User: dto.UserInfo{
            ID:       user.ID,
            Email:    user.Email,
            Nickname: user.Nickname,
            Avatar:   user.AvatarURL,
            Role:     user.Role,    // ← 新增
        },
    }, nil
}
```

---

## 4. AdminMiddleware

**文件：`internal/middleware/admin.go`**

```go
package middleware

import (
    "github.com/gin-gonic/gin"
    "gennovel/internal/model"
    "gennovel/internal/utils"
)

// Admin 管理员鉴权中间件
// 必须在 Auth() 之后使用，从 Context 中读取 role
func Admin() gin.HandlerFunc {
    return func(c *gin.Context) {
        role := c.GetString("role")

        if role != model.RoleAdmin && role != model.RoleSuperAdmin {
            utils.Forbidden(c, "无管理权限")
            c.Abort()
            return
        }

        // 将 adminID 写入 Context（与 userID 相同，语义更清晰）
        c.Set("adminID", c.GetUint("userID"))
        c.Next()
    }
}
```

**用法：**

```go
admin := api.Group("/admin")
admin.Use(middleware.Auth(), middleware.Admin())
{
    admin.GET("/dashboard/stats", handler.AdminGetDashboardStats)
    // ...
}
```

---

## 5. DTO 设计

**文件：`internal/dto/admin.go`**

```go
package dto

import "time"

// ==================== 通用分页 ====================

type AdminPaginationRequest struct {
    Page     int `form:"page" binding:"omitempty,min=1"`
    PageSize int `form:"page_size" binding:"omitempty,min=1,max=100"`
}

func (r *AdminPaginationRequest) GetPage() int {
    if r.Page <= 0 { return 1 }
    return r.Page
}

func (r *AdminPaginationRequest) GetPageSize() int {
    if r.PageSize <= 0 { return 20 }
    return r.PageSize
}

func (r *AdminPaginationRequest) GetOffset() int {
    return (r.GetPage() - 1) * r.GetPageSize()
}

type PaginatedResult struct {
    Total int64       `json:"total"`
    Items interface{} `json:"items"`
}

// ==================== 仪表盘 ====================

type DashboardStatsResponse struct {
    TotalUsers           int64   `json:"total_users"`
    TodayActive          int64   `json:"today_active"`
    TodayNewUsers        int64   `json:"today_new_users"`
    TodayRevenueYuan     float64 `json:"today_revenue_yuan"`
    YesterdayActive      int64   `json:"yesterday_active"`
    YesterdayNewUsers    int64   `json:"yesterday_new_users"`
    YesterdayRevenueYuan float64 `json:"yesterday_revenue_yuan"`
}

type TrendRequest struct {
    Type string `form:"type" binding:"required,oneof=users revenue tokens"`
    Days int    `form:"days" binding:"required,oneof=7 30 90"`
}

type TrendItem struct {
    Date  string  `json:"date"`
    Value float64 `json:"value"`
}

type RecentLogResponse struct {
    ID          uint   `json:"id"`
    AdminEmail  string `json:"admin_email"`
    Action      string `json:"action"`
    ActionLabel string `json:"action_label"`
    Target      string `json:"target"`
    Summary     string `json:"summary"`
    CreatedAt   string `json:"created_at"`
}

// ==================== 用户管理 ====================

type AdminUserListRequest struct {
    AdminPaginationRequest
    Keyword   string `form:"keyword"`
    Status    *int8  `form:"status"`   // 指针，区分 0(封禁) 和未传
    StartDate string `form:"start_date"`
    EndDate   string `form:"end_date"`
}

type AdminUserListItem struct {
    ID           uint   `json:"id"`
    Email        string `json:"email"`
    Nickname     string `json:"nickname"`
    AvatarURL    string `json:"avatar_url"`
    Status       int8   `json:"status"`
    Role         string `json:"role"`
    Balance      int64  `json:"balance"`
    CreatedAt    string `json:"created_at"`
    LastActiveAt string `json:"last_active_at,omitempty"`
}

type AdminUserDetailResponse struct {
    ID            uint   `json:"id"`
    Email         string `json:"email"`
    Nickname      string `json:"nickname"`
    AvatarURL     string `json:"avatar_url"`
    Status        int8   `json:"status"`
    Role          string `json:"role"`
    InviteCode    string `json:"invite_code"`
    EmailVerified bool   `json:"email_verified"`
    CreatedAt     string `json:"created_at"`
    LastActiveAt  string `json:"last_active_at,omitempty"`
    Balance       struct {
        Balance        int64 `json:"balance"`
        TotalRecharged int64 `json:"total_recharged"`
        TotalConsumed  int64 `json:"total_consumed"`
        TotalGifted    int64 `json:"total_gifted"`
    } `json:"balance"`
    RecentTransactions []AdminTransactionItem `json:"recent_transactions"`
}

type UpdateUserStatusRequest struct {
    Status int8   `json:"status" binding:"oneof=0 1"`
    Reason string `json:"reason" binding:"required,min=2"`
}

type AdjustBalanceRequest struct {
    Type   string `json:"type" binding:"required,oneof=increase decrease"`
    Amount int64  `json:"amount" binding:"required,gt=0"`
    Reason string `json:"reason" binding:"required,min=2"`
}

type ResetPasswordRequest struct {
    SendEmail bool `json:"send_email"`
}

// ==================== 订单管理 ====================

type AdminOrderListRequest struct {
    AdminPaginationRequest
    Status        *int8  `form:"status"`
    PaymentMethod string `form:"payment_method"`
    UserEmail     string `form:"user_email"`
    StartDate     string `form:"start_date"`
    EndDate       string `form:"end_date"`
}

type AdminOrderListItem struct {
    ID            uint    `json:"id"`
    OrderNo       string  `json:"order_no"`
    UserID        uint    `json:"user_id"`
    UserEmail     string  `json:"user_email"`
    AmountYuan    float64 `json:"amount_yuan"`
    Points        int64   `json:"points"`
    PaymentMethod string  `json:"payment_method"`
    Status        int8    `json:"status"`
    CreatedAt     string  `json:"created_at"`
    PaidAt        string  `json:"paid_at,omitempty"`
}

type AdminOrderSummaryResponse struct {
    TotalCount      int64   `json:"total_count"`
    PaidAmount      float64 `json:"paid_amount"`
    PendingAmount   float64 `json:"pending_amount"`
    CancelledAmount float64 `json:"cancelled_amount"`
    RefundedAmount  float64 `json:"refunded_amount"`
}

// ==================== 交易流水 ====================

type AdminTransactionListRequest struct {
    AdminPaginationRequest
    Type      string `form:"type" binding:"omitempty,oneof=recharge consumption gift referral refund"`
    UserEmail string `form:"user_email"`
    StartDate string `form:"start_date"`
    EndDate   string `form:"end_date"`
}

type AdminTransactionItem struct {
    ID           uint   `json:"id"`
    UserID       uint   `json:"user_id"`
    UserEmail    string `json:"user_email"`
    Type         string `json:"type"`
    Amount       int64  `json:"amount"`
    BalanceAfter int64  `json:"balance_after"`
    Description  string `json:"description"`
    CreatedAt    string `json:"created_at"`
}

// ==================== 公告管理 ====================

type AdminAnnouncementListRequest struct {
    AdminPaginationRequest
    MsgType   string `form:"msg_type" binding:"omitempty,oneof=notice account usage"`
    StartDate string `form:"start_date"`
    EndDate   string `form:"end_date"`
}

type AdminAnnouncementListItem struct {
    ID          uint   `json:"id"`
    MsgType     string `json:"msg_type"`
    Title       string `json:"title"`
    Content     string `json:"content"`
    Target      string `json:"target"`       // all / specific
    TargetCount int64  `json:"target_count"` // 触达人数
    ReadCount   int64  `json:"read_count"`   // 已读数
    CreatedAt   string `json:"created_at"`
}

type CreateAnnouncementRequest struct {
    MsgType      string   `json:"msg_type" binding:"required,oneof=notice account usage"`
    Title        string   `json:"title" binding:"required,max=100"`
    Content      string   `json:"content" binding:"required,max=2000"`
    Target       string   `json:"target" binding:"required,oneof=all specific"`
    TargetEmails []string `json:"target_emails"` // target=specific 时必填
}

// ==================== 系统配置 ====================

type AdminConfigItem struct {
    ConfigKey   string      `json:"config_key"`
    ConfigValue interface{} `json:"config_value"`
    Description string      `json:"description"`
    UpdatedBy   uint        `json:"updated_by"`
    UpdatedAt   string      `json:"updated_at"`
}

type UpdateConfigsRequest struct {
    Configs []ConfigUpdateItem `json:"configs" binding:"required,min=1"`
}

type ConfigUpdateItem struct {
    ConfigKey   string      `json:"config_key" binding:"required"`
    ConfigValue interface{} `json:"config_value" binding:"required"`
}

// ==================== 操作日志 ====================

type AdminAuditLogListRequest struct {
    AdminPaginationRequest
    Action     string `form:"action"`
    AdminID    *uint  `form:"admin_id"`
    TargetType string `form:"target_type"`
    StartDate  string `form:"start_date"`
    EndDate    string `form:"end_date"`
}

type AdminAuditLogListItem struct {
    ID          uint   `json:"id"`
    AdminID     uint   `json:"admin_id"`
    AdminEmail  string `json:"admin_email"`
    Action      string `json:"action"`
    ActionLabel string `json:"action_label"`
    TargetType  string `json:"target_type"`
    TargetID    string `json:"target_id"`
    Summary     string `json:"summary"`
    IPAddress   string `json:"ip_address"`
    CreatedAt   string `json:"created_at"`
}

type AdminAuditLogDetailResponse struct {
    AdminAuditLogListItem
    Detail interface{} `json:"detail"`
}
```

---

## 6. Service 层设计

### 6.1 AuditLogService — 审计日志服务（被其他 Service 复用）

**文件：`internal/service/admin_audit_service.go`**

```go
package service

import (
    "encoding/json"
    "fmt"

    "gennovel/internal/database"
    "gennovel/internal/dto"
    "gennovel/internal/model"
)

type AdminAuditService struct{}

func NewAdminAuditService() *AdminAuditService {
    return &AdminAuditService{}
}

// Record 写入审计日志（在操作的事务外异步调用，或与操作同事务调用）
func (s *AdminAuditService) Record(adminID uint, action string,
    targetType string, targetID string, detail interface{}, ip string) {

    db := database.GetDB()

    detailJSON, _ := json.Marshal(detail)

    log := &model.AdminAuditLog{
        AdminID:    adminID,
        Action:     action,
        TargetType: targetType,
        TargetID:   targetID,
        Detail:     detailJSON,
        IPAddress:  ip,
    }
    db.Create(log)
}

// RecordWithTx 在事务内写入审计日志
func (s *AdminAuditService) RecordWithTx(tx *gorm.DB, adminID uint,
    action string, targetType string, targetID string,
    detail interface{}, ip string) error {

    detailJSON, _ := json.Marshal(detail)

    log := &model.AdminAuditLog{
        AdminID:    adminID,
        Action:     action,
        TargetType: targetType,
        TargetID:   targetID,
        Detail:     detailJSON,
        IPAddress:  ip,
    }
    return tx.Create(log).Error
}

// List 查询审计日志列表
func (s *AdminAuditService) List(req *dto.AdminAuditLogListRequest) (*dto.PaginatedResult, error) {
    db := database.GetDB()

    query := db.Model(&model.AdminAuditLog{})

    // 筛选
    if req.Action != "" {
        query = query.Where("action = ?", req.Action)
    }
    if req.AdminID != nil {
        query = query.Where("admin_id = ?", *req.AdminID)
    }
    if req.TargetType != "" {
        query = query.Where("target_type = ?", req.TargetType)
    }
    if req.StartDate != "" {
        query = query.Where("created_at >= ?", req.StartDate)
    }
    if req.EndDate != "" {
        query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
    }

    var total int64
    query.Count(&total)

    var logs []model.AdminAuditLog
    err := query.
        Order("created_at DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Find(&logs).Error
    if err != nil {
        return nil, err
    }

    // 查询管理员邮箱 (批量)
    adminIDs := extractAdminIDs(logs)
    emailMap := s.getAdminEmails(adminIDs)

    // 转 DTO
    items := make([]dto.AdminAuditLogListItem, len(logs))
    for i, l := range logs {
        items[i] = dto.AdminAuditLogListItem{
            ID:          l.ID,
            AdminID:     l.AdminID,
            AdminEmail:  emailMap[l.AdminID],
            Action:      l.Action,
            ActionLabel: model.AuditActionLabels[l.Action],
            TargetType:  l.TargetType,
            TargetID:    l.TargetID,
            Summary:     s.buildSummary(l),
            IPAddress:   l.IPAddress,
            CreatedAt:   l.CreatedAt.Format("2006-01-02 15:04:05"),
        }
    }

    return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetDetail 获取日志详情
func (s *AdminAuditService) GetDetail(id uint) (*dto.AdminAuditLogDetailResponse, error) {
    db := database.GetDB()

    var log model.AdminAuditLog
    if err := db.First(&log, id).Error; err != nil {
        return nil, err
    }

    emailMap := s.getAdminEmails([]uint{log.AdminID})

    var detail interface{}
    json.Unmarshal(log.Detail, &detail)

    return &dto.AdminAuditLogDetailResponse{
        AdminAuditLogListItem: dto.AdminAuditLogListItem{
            ID:          log.ID,
            AdminID:     log.AdminID,
            AdminEmail:  emailMap[log.AdminID],
            Action:      log.Action,
            ActionLabel: model.AuditActionLabels[log.Action],
            TargetType:  log.TargetType,
            TargetID:    log.TargetID,
            Summary:     s.buildSummary(log),
            IPAddress:   log.IPAddress,
            CreatedAt:   log.CreatedAt.Format("2006-01-02 15:04:05"),
        },
        Detail: detail,
    }, nil
}

// getAdminEmails 批量查询管理员邮箱
func (s *AdminAuditService) getAdminEmails(ids []uint) map[uint]string {
    if len(ids) == 0 {
        return map[uint]string{}
    }
    db := database.GetDB()
    type result struct {
        ID    uint
        Email string
    }
    var results []result
    db.Model(&model.User{}).Select("id, email").Where("id IN ?", ids).Scan(&results)

    m := make(map[uint]string, len(results))
    for _, r := range results {
        m[r.ID] = r.Email
    }
    return m
}

// buildSummary 根据 action 和 detail 生成摘要文本
func (s *AdminAuditService) buildSummary(log model.AdminAuditLog) string {
    var detail map[string]interface{}
    json.Unmarshal(log.Detail, &detail)

    switch log.Action {
    case model.AuditUserDisable:
        return fmt.Sprintf("原因: %v", detail["reason"])
    case model.AuditUserAdjustBal:
        return fmt.Sprintf("%+v %v", detail["amount"], detail["reason"])
    case model.AuditMsgBroadcast:
        return fmt.Sprintf("%v", detail["title"])
    case model.AuditConfigUpdate:
        return fmt.Sprintf("更新 %d 项配置", len(detail))
    default:
        return ""
    }
}
```

### 6.2 DashboardService — 仪表盘服务

**文件：`internal/service/admin_dashboard_service.go`**

```go
package service

type AdminDashboardService struct{}

func NewAdminDashboardService() *AdminDashboardService {
    return &AdminDashboardService{}
}

// GetStats 获取仪表盘统计指标
func (s *AdminDashboardService) GetStats() (*dto.DashboardStatsResponse, error) {
    db := database.GetDB()

    today := time.Now().Truncate(24 * time.Hour)
    yesterday := today.AddDate(0, 0, -1)

    var resp dto.DashboardStatsResponse

    // 总用户数
    db.Model(&model.User{}).
        Where("deleted_at IS NULL").
        Count(&resp.TotalUsers)

    // 今日活跃（有 token_usage 记录的去重用户数）
    db.Model(&model.TokenUsage{}).
        Where("created_at >= ?", today).
        Distinct("user_id").
        Count(&resp.TodayActive)

    // 昨日活跃
    db.Model(&model.TokenUsage{}).
        Where("created_at >= ? AND created_at < ?", yesterday, today).
        Distinct("user_id").
        Count(&resp.YesterdayActive)

    // 今日新增
    db.Model(&model.User{}).
        Where("created_at >= ? AND deleted_at IS NULL", today).
        Count(&resp.TodayNewUsers)

    // 昨日新增
    db.Model(&model.User{}).
        Where("created_at >= ? AND created_at < ? AND deleted_at IS NULL", yesterday, today).
        Count(&resp.YesterdayNewUsers)

    // 今日收入（已支付订单金额合计）
    db.Model(&model.RechargeOrder{}).
        Where("status = ? AND paid_at >= ?", model.OrderStatusPaid, today).
        Select("COALESCE(SUM(amount_yuan), 0)").
        Scan(&resp.TodayRevenueYuan)

    // 昨日收入
    db.Model(&model.RechargeOrder{}).
        Where("status = ? AND paid_at >= ? AND paid_at < ?",
            model.OrderStatusPaid, yesterday, today).
        Select("COALESCE(SUM(amount_yuan), 0)").
        Scan(&resp.YesterdayRevenueYuan)

    return &resp, nil
}

// GetTrends 获取趋势数据
func (s *AdminDashboardService) GetTrends(req *dto.TrendRequest) ([]dto.TrendItem, error) {
    db := database.GetDB()

    startDate := time.Now().AddDate(0, 0, -req.Days)
    var results []dto.TrendItem

    switch req.Type {
    case "users":
        // 每日新注册用户数
        err := db.Model(&model.User{}).
            Select("DATE(created_at) as date, COUNT(*) as value").
            Where("created_at >= ? AND deleted_at IS NULL", startDate).
            Group("DATE(created_at)").
            Order("date ASC").
            Scan(&results).Error
        return results, err

    case "revenue":
        // 每日充值金额
        err := db.Model(&model.RechargeOrder{}).
            Select("DATE(paid_at) as date, COALESCE(SUM(amount_yuan), 0) as value").
            Where("status = ? AND paid_at >= ?", model.OrderStatusPaid, startDate).
            Group("DATE(paid_at)").
            Order("date ASC").
            Scan(&results).Error
        return results, err

    case "tokens":
        // 每日 Token 总消耗
        err := db.Model(&model.TokenUsage{}).
            Select("DATE(created_at) as date, COALESCE(SUM(total_tokens), 0) as value").
            Where("created_at >= ?", startDate).
            Group("DATE(created_at)").
            Order("date ASC").
            Scan(&results).Error
        return results, err
    }

    return results, nil
}

// GetRecentLogs 获取最近操作日志（简要）
func (s *AdminDashboardService) GetRecentLogs(limit int) ([]dto.RecentLogResponse, error) {
    db := database.GetDB()

    var logs []model.AdminAuditLog
    err := db.Order("created_at DESC").Limit(limit).Find(&logs).Error
    if err != nil {
        return nil, err
    }

    auditSvc := NewAdminAuditService()
    adminIDs := extractAdminIDs(logs)
    emailMap := auditSvc.getAdminEmails(adminIDs)

    items := make([]dto.RecentLogResponse, len(logs))
    for i, l := range logs {
        items[i] = dto.RecentLogResponse{
            ID:          l.ID,
            AdminEmail:  emailMap[l.AdminID],
            Action:      l.Action,
            ActionLabel: model.AuditActionLabels[l.Action],
            Target:      fmt.Sprintf("%s#%s", l.TargetType, l.TargetID),
            Summary:     auditSvc.buildSummary(l),
            CreatedAt:   l.CreatedAt.Format("2006-01-02 15:04:05"),
        }
    }

    return items, nil
}
```

### 6.3 AdminUserService — 用户管理服务

**文件：`internal/service/admin_user_service.go`**

```go
package service

type AdminUserService struct {
    balanceService *BalanceService
    auditService   *AdminAuditService
}

func NewAdminUserService(bs *BalanceService, as *AdminAuditService) *AdminUserService {
    return &AdminUserService{balanceService: bs, auditService: as}
}

// List 用户列表（支持搜索/筛选/分页）
func (s *AdminUserService) List(req *dto.AdminUserListRequest) (*dto.PaginatedResult, error) {
    db := database.GetDB()

    query := db.Model(&model.User{}).Where("deleted_at IS NULL")

    // 关键词搜索（模糊匹配邮箱或昵称）
    if req.Keyword != "" {
        keyword := "%" + req.Keyword + "%"
        query = query.Where("email ILIKE ? OR nickname ILIKE ?", keyword, keyword)
    }
    // 状态筛选
    if req.Status != nil {
        query = query.Where("status = ?", *req.Status)
    }
    // 注册时间筛选
    if req.StartDate != "" {
        query = query.Where("created_at >= ?", req.StartDate)
    }
    if req.EndDate != "" {
        query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
    }

    var total int64
    query.Count(&total)

    // 联表查询余额
    type userWithBalance struct {
        model.User
        Balance int64 `gorm:"column:balance"`
    }
    var users []userWithBalance

    err := query.
        Select("users.*, COALESCE(ub.balance, 0) as balance").
        Joins("LEFT JOIN bff_schema.user_balance ub ON ub.user_id = users.id").
        Order("users.created_at DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Scan(&users).Error
    if err != nil {
        return nil, err
    }

    items := make([]dto.AdminUserListItem, len(users))
    for i, u := range users {
        items[i] = dto.AdminUserListItem{
            ID:        u.ID,
            Email:     u.Email,
            Nickname:  u.Nickname,
            AvatarURL: u.AvatarURL,
            Status:    u.Status,
            Role:      u.Role,
            Balance:   u.Balance,
            CreatedAt: u.CreatedAt.Format("2006-01-02 15:04"),
        }
    }

    return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetDetail 用户详情（基本信息 + 余额 + 最近交易）
func (s *AdminUserService) GetDetail(userID uint) (*dto.AdminUserDetailResponse, error) {
    db := database.GetDB()

    var user model.User
    if err := db.First(&user, userID).Error; err != nil {
        return nil, ErrUserNotFound
    }

    // 余额
    var balance model.UserBalance
    db.Where("user_id = ?", userID).First(&balance)

    // 最近 5 条交易
    var txns []model.Transaction
    db.Where("user_id = ?", userID).
        Order("created_at DESC").
        Limit(5).
        Find(&txns)

    recentTxns := make([]dto.AdminTransactionItem, len(txns))
    for i, t := range txns {
        recentTxns[i] = dto.AdminTransactionItem{
            ID:           t.ID,
            UserID:       t.UserID,
            Type:         t.Type,
            Amount:       t.Amount,
            BalanceAfter: t.BalanceAfter,
            Description:  t.Description,
            CreatedAt:    t.CreatedAt.Format("2006-01-02 15:04"),
        }
    }

    return &dto.AdminUserDetailResponse{
        ID:            user.ID,
        Email:         user.Email,
        Nickname:      user.Nickname,
        AvatarURL:     user.AvatarURL,
        Status:        user.Status,
        Role:          user.Role,
        InviteCode:    user.InviteCode,
        EmailVerified: user.EmailVerified,
        CreatedAt:     user.CreatedAt.Format("2006-01-02 15:04:05"),
        Balance: struct {
            Balance        int64 `json:"balance"`
            TotalRecharged int64 `json:"total_recharged"`
            TotalConsumed  int64 `json:"total_consumed"`
            TotalGifted    int64 `json:"total_gifted"`
        }{
            Balance:        balance.Balance,
            TotalRecharged: balance.TotalRecharged,
            TotalConsumed:  balance.TotalConsumed,
            TotalGifted:    balance.TotalGifted,
        },
        RecentTransactions: recentTxns,
    }, nil
}

// UpdateStatus 封禁/解封用户
func (s *AdminUserService) UpdateStatus(adminID uint, userID uint,
    req *dto.UpdateUserStatusRequest, ip string) error {

    db := database.GetDB()

    result := db.Model(&model.User{}).
        Where("id = ? AND deleted_at IS NULL", userID).
        Update("status", req.Status)
    if result.Error != nil {
        return result.Error
    }
    if result.RowsAffected == 0 {
        return ErrUserNotFound
    }

    // 审计日志
    action := model.AuditUserDisable
    if req.Status == 1 {
        action = model.AuditUserEnable
    }
    s.auditService.Record(adminID, action,
        model.TargetTypeUser, fmt.Sprintf("%d", userID),
        map[string]interface{}{
            "status": req.Status,
            "reason": req.Reason,
        }, ip)

    return nil
}

// AdjustBalance 手动调账
func (s *AdminUserService) AdjustBalance(adminID uint, userID uint,
    req *dto.AdjustBalanceRequest, ip string) error {

    // 获取调账前余额（用于审计）
    balResp, err := s.balanceService.GetBalance(userID)
    if err != nil {
        return err
    }

    var txType string
    var desc string
    if req.Type == "increase" {
        txType = model.TxTypeGift
        desc = fmt.Sprintf("管理员调账(增加): %s", req.Reason)
        err = s.balanceService.Credit(userID, req.Amount, txType,
            desc, fmt.Sprintf("admin:%d", adminID), "admin_adjust", nil)
    } else {
        // 扣除 — 检查余额
        if balResp.Balance < req.Amount {
            return ErrInsufficientBalance
        }
        txType = model.TxTypeRefund // 扣除记为退款类型
        desc = fmt.Sprintf("管理员调账(扣除): %s", req.Reason)
        err = s.balanceService.Deduct(userID, req.Amount,
            desc, fmt.Sprintf("admin:%d", adminID), "admin_adjust", nil)
    }
    if err != nil {
        return err
    }

    // 审计日志
    s.auditService.Record(adminID, model.AuditUserAdjustBal,
        model.TargetTypeUser, fmt.Sprintf("%d", userID),
        map[string]interface{}{
            "type":           req.Type,
            "amount":         req.Amount,
            "reason":         req.Reason,
            "balance_before": balResp.Balance,
            "balance_after":  balResp.Balance + func() int64 {
                if req.Type == "increase" { return req.Amount }
                return -req.Amount
            }(),
        }, ip)

    return nil
}

// ResetPassword 重置密码
func (s *AdminUserService) ResetPassword(adminID uint, userID uint,
    sendEmail bool, ip string) error {

    db := database.GetDB()

    var user model.User
    if err := db.First(&user, userID).Error; err != nil {
        return ErrUserNotFound
    }

    // 生成随机密码
    newPassword := generateRandomPassword(12)
    hashedPwd, err := utils.HashPassword(newPassword)
    if err != nil {
        return err
    }

    // 更新密码
    if err := db.Model(&user).Update("password_hash", hashedPwd).Error; err != nil {
        return err
    }

    // 发送邮件（异步）
    if sendEmail {
        go func() {
            emailService.SendPasswordResetNotification(user.Email, newPassword)
        }()
    }

    // 审计日志
    s.auditService.Record(adminID, model.AuditUserResetPwd,
        model.TargetTypeUser, fmt.Sprintf("%d", userID),
        map[string]interface{}{
            "user_email": user.Email,
            "send_email": sendEmail,
        }, ip)

    return nil
}
```

### 6.4 AdminOrderService — 订单与交易服务

**文件：`internal/service/admin_order_service.go`**

```go
package service

type AdminOrderService struct{}

func NewAdminOrderService() *AdminOrderService {
    return &AdminOrderService{}
}

// ListOrders 订单列表
func (s *AdminOrderService) ListOrders(req *dto.AdminOrderListRequest) (*dto.PaginatedResult, error) {
    db := database.GetDB()

    query := db.Model(&model.RechargeOrder{})

    if req.Status != nil {
        query = query.Where("recharge_orders.status = ?", *req.Status)
    }
    if req.PaymentMethod != "" {
        query = query.Where("recharge_orders.payment_method = ?", req.PaymentMethod)
    }
    if req.UserEmail != "" {
        // 联表搜索用户邮箱
        keyword := "%" + req.UserEmail + "%"
        query = query.Joins("JOIN bff_schema.users u ON u.id = recharge_orders.user_id").
            Where("u.email ILIKE ?", keyword)
    }
    if req.StartDate != "" {
        query = query.Where("recharge_orders.created_at >= ?", req.StartDate)
    }
    if req.EndDate != "" {
        query = query.Where("recharge_orders.created_at < ?", req.EndDate+" 23:59:59")
    }

    var total int64
    query.Count(&total)

    type orderWithEmail struct {
        model.RechargeOrder
        UserEmail string `gorm:"column:user_email"`
    }
    var orders []orderWithEmail

    err := query.
        Select("recharge_orders.*, u.email as user_email").
        Joins("JOIN bff_schema.users u ON u.id = recharge_orders.user_id").
        Order("recharge_orders.created_at DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Scan(&orders).Error
    if err != nil {
        return nil, err
    }

    items := make([]dto.AdminOrderListItem, len(orders))
    for i, o := range orders {
        item := dto.AdminOrderListItem{
            ID:            o.ID,
            OrderNo:       o.OrderNo,
            UserID:        o.UserID,
            UserEmail:     o.UserEmail,
            AmountYuan:    o.AmountYuan,
            Points:        o.Points,
            PaymentMethod: o.PaymentMethod,
            Status:        o.Status,
            CreatedAt:     o.CreatedAt.Format("2006-01-02 15:04"),
        }
        if o.PaidAt != nil {
            item.PaidAt = o.PaidAt.Format("2006-01-02 15:04")
        }
        items[i] = item
    }

    return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetOrderSummary 订单统计概要
func (s *AdminOrderService) GetOrderSummary(req *dto.AdminOrderListRequest) (*dto.AdminOrderSummaryResponse, error) {
    db := database.GetDB()

    type summaryRow struct {
        Status    int8    `gorm:"column:status"`
        Total     int64   `gorm:"column:total"`
        Amount    float64 `gorm:"column:amount"`
    }
    var rows []summaryRow

    query := db.Model(&model.RechargeOrder{}).
        Select("status, COUNT(*) as total, COALESCE(SUM(amount_yuan), 0) as amount").
        Group("status")

    // 应用与 ListOrders 相同的筛选条件（不含分页）
    if req.StartDate != "" {
        query = query.Where("created_at >= ?", req.StartDate)
    }
    if req.EndDate != "" {
        query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
    }

    if err := query.Scan(&rows).Error; err != nil {
        return nil, err
    }

    resp := &dto.AdminOrderSummaryResponse{}
    for _, r := range rows {
        resp.TotalCount += r.Total
        switch r.Status {
        case model.OrderStatusPaid:
            resp.PaidAmount = r.Amount
        case model.OrderStatusPending:
            resp.PendingAmount = r.Amount
        case model.OrderStatusCancelled:
            resp.CancelledAmount = r.Amount
        case model.OrderStatusRefunded:
            resp.RefundedAmount = r.Amount
        }
    }

    return resp, nil
}

// ListTransactions 管理端交易流水列表
func (s *AdminOrderService) ListTransactions(req *dto.AdminTransactionListRequest) (*dto.PaginatedResult, error) {
    db := database.GetDB()

    query := db.Model(&model.Transaction{})

    if req.Type != "" {
        query = query.Where("transactions.type = ?", req.Type)
    }
    if req.UserEmail != "" {
        keyword := "%" + req.UserEmail + "%"
        query = query.Joins("JOIN bff_schema.users u ON u.id = transactions.user_id").
            Where("u.email ILIKE ?", keyword)
    }
    if req.StartDate != "" {
        query = query.Where("transactions.created_at >= ?", req.StartDate)
    }
    if req.EndDate != "" {
        query = query.Where("transactions.created_at < ?", req.EndDate+" 23:59:59")
    }

    var total int64
    query.Count(&total)

    type txWithEmail struct {
        model.Transaction
        UserEmail string `gorm:"column:user_email"`
    }
    var txns []txWithEmail

    err := query.
        Select("transactions.*, u.email as user_email").
        Joins("JOIN bff_schema.users u ON u.id = transactions.user_id").
        Order("transactions.created_at DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Scan(&txns).Error
    if err != nil {
        return nil, err
    }

    items := make([]dto.AdminTransactionItem, len(txns))
    for i, t := range txns {
        items[i] = dto.AdminTransactionItem{
            ID:           t.ID,
            UserID:       t.UserID,
            UserEmail:    t.UserEmail,
            Type:         t.Type,
            Amount:       t.Amount,
            BalanceAfter: t.BalanceAfter,
            Description:  t.Description,
            CreatedAt:    t.CreatedAt.Format("2006-01-02 15:04"),
        }
    }

    return &dto.PaginatedResult{Total: total, Items: items}, nil
}
```

### 6.5 AdminAnnounceService — 公告管理服务

**文件：`internal/service/admin_announce_service.go`**

```go
package service

type AdminAnnounceService struct {
    auditService *AdminAuditService
}

func NewAdminAnnounceService(as *AdminAuditService) *AdminAnnounceService {
    return &AdminAnnounceService{auditService: as}
}

// List 公告列表（按首条去重，每个公告只显示一次）
func (s *AdminAnnounceService) List(req *dto.AdminAnnouncementListRequest) (*dto.PaginatedResult, error) {
    db := database.GetDB()

    // 公告在 system_messages 中按 user_id 分多条存储
    // 列表按 (title, content, msg_type, created_at) 分组取第一条
    // 简化方案：通过 audit_log 的 message.broadcast 记录查询公告列表
    query := db.Model(&model.AdminAuditLog{}).
        Where("action = ?", model.AuditMsgBroadcast)

    if req.MsgType != "" {
        query = query.Where("detail->>'msg_type' = ?", req.MsgType)
    }
    if req.StartDate != "" {
        query = query.Where("created_at >= ?", req.StartDate)
    }
    if req.EndDate != "" {
        query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
    }

    var total int64
    query.Count(&total)

    var logs []model.AdminAuditLog
    err := query.
        Order("created_at DESC").
        Offset(req.GetOffset()).
        Limit(req.GetPageSize()).
        Find(&logs).Error
    if err != nil {
        return nil, err
    }

    items := make([]dto.AdminAnnouncementListItem, len(logs))
    for i, l := range logs {
        var detail map[string]interface{}
        json.Unmarshal(l.Detail, &detail)

        targetCount, _ := detail["target_count"].(float64)
        readCount := s.getReadCount(l.ID)

        items[i] = dto.AdminAnnouncementListItem{
            ID:          l.ID,
            MsgType:     fmt.Sprintf("%v", detail["msg_type"]),
            Title:       fmt.Sprintf("%v", detail["title"]),
            Content:     fmt.Sprintf("%v", detail["content"]),
            Target:      fmt.Sprintf("%v", detail["target"]),
            TargetCount: int64(targetCount),
            ReadCount:   readCount,
            CreatedAt:   l.CreatedAt.Format("2006-01-02 15:04"),
        }
    }

    return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// Create 发送公告
func (s *AdminAnnounceService) Create(adminID uint,
    req *dto.CreateAnnouncementRequest, ip string) error {

    db := database.GetDB()

    return db.Transaction(func(tx *gorm.DB) error {
        var userIDs []uint

        if req.Target == "all" {
            // 全部活跃用户
            tx.Model(&model.User{}).
                Where("status = 1 AND deleted_at IS NULL").
                Pluck("id", &userIDs)
        } else {
            // 指定邮箱
            if len(req.TargetEmails) == 0 {
                return errors.New("指定用户时邮箱列表不能为空")
            }
            tx.Model(&model.User{}).
                Where("email IN ? AND status = 1 AND deleted_at IS NULL", req.TargetEmails).
                Pluck("id", &userIDs)
        }

        if len(userIDs) == 0 {
            return errors.New("没有符合条件的目标用户")
        }

        // 批量创建 system_messages
        messages := make([]model.SystemMessage, len(userIDs))
        for i, uid := range userIDs {
            messages[i] = model.SystemMessage{
                UserID:  uid,
                Title:   req.Title,
                Content: req.Content,
                MsgType: req.MsgType,
                IsRead:  false,
            }
        }

        // 分批插入（每批 500 条）
        batchSize := 500
        for i := 0; i < len(messages); i += batchSize {
            end := i + batchSize
            if end > len(messages) {
                end = len(messages)
            }
            if err := tx.Create(messages[i:end]).Error; err != nil {
                return err
            }
        }

        // 审计日志
        return s.auditService.RecordWithTx(tx, adminID,
            model.AuditMsgBroadcast, model.TargetTypeMessage, "",
            map[string]interface{}{
                "msg_type":     req.MsgType,
                "title":        req.Title,
                "content":      req.Content,
                "target":       req.Target,
                "target_count": len(userIDs),
            }, ip)
    })
}

// Delete 删除公告（软删除对应的所有 system_messages）
func (s *AdminAnnounceService) Delete(adminID uint, auditLogID uint, ip string) error {
    db := database.GetDB()

    // 从审计日志获取公告详情
    var log model.AdminAuditLog
    if err := db.First(&log, auditLogID).Error; err != nil {
        return errors.New("公告不存在")
    }

    var detail map[string]interface{}
    json.Unmarshal(log.Detail, &detail)
    title := fmt.Sprintf("%v", detail["title"])

    // 删除同标题同时间的所有 system_messages
    result := db.Where("title = ? AND created_at >= ? AND created_at <= ?",
        title,
        log.CreatedAt.Add(-time.Second),
        log.CreatedAt.Add(time.Second),
    ).Delete(&model.SystemMessage{})

    // 审计日志
    s.auditService.Record(adminID, model.AuditMsgDelete,
        model.TargetTypeMessage, fmt.Sprintf("%d", auditLogID),
        map[string]interface{}{
            "title":         title,
            "deleted_count": result.RowsAffected,
        }, ip)

    return nil
}
```

### 6.6 AdminConfigService — 系统配置服务

**文件：`internal/service/admin_config_service.go`**

```go
package service

type AdminConfigService struct {
    auditService *AdminAuditService
}

func NewAdminConfigService(as *AdminAuditService) *AdminConfigService {
    return &AdminConfigService{auditService: as}
}

// GetAll 获取所有配置
func (s *AdminConfigService) GetAll() ([]dto.AdminConfigItem, error) {
    db := database.GetDB()

    var configs []model.SystemConfig
    err := db.Order("config_key ASC").Find(&configs).Error
    if err != nil {
        return nil, err
    }

    items := make([]dto.AdminConfigItem, len(configs))
    for i, c := range configs {
        var value interface{}
        json.Unmarshal(c.ConfigValue, &value)

        items[i] = dto.AdminConfigItem{
            ConfigKey:   c.ConfigKey,
            ConfigValue: value,
            Description: c.Description,
            UpdatedBy:   c.UpdatedBy,
            UpdatedAt:   c.UpdatedAt.Format("2006-01-02 15:04:05"),
        }
    }

    return items, nil
}

// BatchUpdate 批量更新配置
func (s *AdminConfigService) BatchUpdate(adminID uint,
    req *dto.UpdateConfigsRequest, ip string) error {

    db := database.GetDB()

    return db.Transaction(func(tx *gorm.DB) error {
        changes := make(map[string]interface{})

        for _, item := range req.Configs {
            valueJSON, err := json.Marshal(item.ConfigValue)
            if err != nil {
                return fmt.Errorf("配置值序列化失败: %s", item.ConfigKey)
            }

            // Upsert: 存在则更新，不存在则插入
            result := tx.Model(&model.SystemConfig{}).
                Where("config_key = ?", item.ConfigKey).
                Updates(map[string]interface{}{
                    "config_value": valueJSON,
                    "updated_by":  adminID,
                    "updated_at":  time.Now(),
                })

            if result.RowsAffected == 0 {
                // 不存在，插入
                cfg := &model.SystemConfig{
                    ConfigKey:   item.ConfigKey,
                    ConfigValue: valueJSON,
                    UpdatedBy:   adminID,
                }
                if err := tx.Create(cfg).Error; err != nil {
                    return err
                }
            }

            changes[item.ConfigKey] = item.ConfigValue
        }

        // 清除 Redis 配置缓存
        s.invalidateConfigCache()

        // 审计日志
        return s.auditService.RecordWithTx(tx, adminID,
            model.AuditConfigUpdate, model.TargetTypeConfig, "",
            changes, ip)
    })
}

// invalidateConfigCache 清除 Redis 中的配置缓存
func (s *AdminConfigService) invalidateConfigCache() {
    redis := database.GetRedis()
    if redis == nil {
        return
    }
    // 删除所有 config:* 键
    keys, _ := redis.Keys(context.Background(), "config:*").Result()
    if len(keys) > 0 {
        redis.Del(context.Background(), keys...)
    }
}

// InitDefaultConfigs 初始化默认配置（首次部署时调用）
func (s *AdminConfigService) InitDefaultConfigs() error {
    defaults := map[string]struct {
        Value       interface{}
        Description string
    }{
        "registration.enabled":     {true, "是否开放注册"},
        "registration.invite_only": {false, "是否仅邀请码注册"},
        "registration.gift_points": {1000, "新用户赠送积分"},
        "referral.referrer_reward": {500, "邀请人奖励积分"},
        "referral.referee_reward":  {200, "被邀请人奖励积分"},
        "balance.low_threshold":    {500, "低余额预警阈值"},
        "recharge.rate":            {100, "人民币兑点数比率"},
        "recharge.min_amount":      {1, "最低充值金额(元)"},
        "recharge.presets": {
            []map[string]interface{}{
                {"yuan": 10, "points": 1000},
                {"yuan": 50, "points": 5000},
                {"yuan": 100, "points": 10000},
                {"yuan": 500, "points": 50000},
            },
            "充值套餐列表",
        },
    }

    db := database.GetDB()
    for key, def := range defaults {
        valueJSON, _ := json.Marshal(def.Value)
        db.Where("config_key = ?", key).
            FirstOrCreate(&model.SystemConfig{
                ConfigKey:   key,
                ConfigValue: valueJSON,
                Description: def.Description,
            })
    }

    return nil
}
```

---

## 7. Handler 层设计

Handler 遵循现有模式：包级 Service 变量 → Init 函数 → Handler 函数。

### 7.1 通用模式

```go
// 从 Context 获取管理员信息
func getAdminContext(c *gin.Context) (adminID uint, ip string) {
    adminID = c.GetUint("adminID")
    ip = c.ClientIP()
    return
}
```

### 7.2 Handler 示例（AdminUserHandler）

**文件：`internal/handler/admin_user_handler.go`**

```go
package handler

var adminUserService *service.AdminUserService

func InitAdminUserService(bs *service.BalanceService, as *service.AdminAuditService) {
    adminUserService = service.NewAdminUserService(bs, as)
}

// AdminGetUsers GET /api/admin/users
func AdminGetUsers(c *gin.Context) {
    var req dto.AdminUserListRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        utils.BadRequest(c, "参数错误")
        return
    }

    result, err := adminUserService.List(&req)
    if err != nil {
        utils.InternalError(c, "获取用户列表失败")
        return
    }
    utils.Success(c, result)
}

// AdminGetUserDetail GET /api/admin/users/:id
func AdminGetUserDetail(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 64)
    if err != nil {
        utils.BadRequest(c, "无效的用户 ID")
        return
    }

    result, err := adminUserService.GetDetail(uint(id))
    if err != nil {
        if errors.Is(err, service.ErrUserNotFound) {
            utils.NotFound(c, "用户不存在")
            return
        }
        utils.InternalError(c, "获取用户详情失败")
        return
    }
    utils.Success(c, result)
}

// AdminUpdateUserStatus PUT /api/admin/users/:id/status
func AdminUpdateUserStatus(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    adminID, ip := getAdminContext(c)

    var req dto.UpdateUserStatusRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.BadRequest(c, "参数错误: "+err.Error())
        return
    }

    err := adminUserService.UpdateStatus(adminID, uint(id), &req, ip)
    if err != nil {
        if errors.Is(err, service.ErrUserNotFound) {
            utils.NotFound(c, "用户不存在")
            return
        }
        utils.InternalError(c, "操作失败")
        return
    }
    utils.SuccessMessage(c, "操作成功")
}

// AdminAdjustBalance POST /api/admin/users/:id/adjust-balance
func AdminAdjustBalance(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    adminID, ip := getAdminContext(c)

    var req dto.AdjustBalanceRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.BadRequest(c, "参数错误: "+err.Error())
        return
    }

    err := adminUserService.AdjustBalance(adminID, uint(id), &req, ip)
    if err != nil {
        if errors.Is(err, service.ErrInsufficientBalance) {
            utils.BadRequest(c, "扣除金额超过当前余额")
            return
        }
        utils.InternalError(c, "调账失败")
        return
    }
    utils.SuccessMessage(c, "调账成功")
}

// AdminResetPassword POST /api/admin/users/:id/reset-password
func AdminResetPassword(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    adminID, ip := getAdminContext(c)

    var req dto.ResetPasswordRequest
    c.ShouldBindJSON(&req)

    err := adminUserService.ResetPassword(adminID, uint(id), req.SendEmail, ip)
    if err != nil {
        if errors.Is(err, service.ErrUserNotFound) {
            utils.NotFound(c, "用户不存在")
            return
        }
        utils.InternalError(c, "重置密码失败")
        return
    }
    utils.SuccessMessage(c, "密码已重置")
}
```

其他 Handler 文件（dashboard、order、announce、config、audit）遵循相同模式，此处不再逐一展开。

---

## 8. 路由注册

**文件：`cmd/server/main.go` — 新增管理端路由**

```go
func setupRoutes(r *gin.Engine, cfg *config.Config) {
    // ========== 现有用户端路由 ==========
    api := r.Group("/api/v1")
    // ... 现有路由 ...

    // ========== 管理端路由（新增）==========

    // 初始化管理端 Service
    auditService := service.NewAdminAuditService()
    dashboardService := service.NewAdminDashboardService()
    adminUserService := service.NewAdminUserService(
        handler.GetBalanceService(), auditService)
    adminOrderService := service.NewAdminOrderService()
    adminAnnounceService := service.NewAdminAnnounceService(auditService)
    adminConfigService := service.NewAdminConfigService(auditService)

    // 注入到 Handler
    handler.InitAdminDashboardService(dashboardService)
    handler.InitAdminUserService(handler.GetBalanceService(), auditService)
    handler.InitAdminOrderService(adminOrderService)
    handler.InitAdminAnnounceService(adminAnnounceService)
    handler.InitAdminConfigService(adminConfigService)
    handler.InitAdminAuditService(auditService)

    // 初始化默认配置
    adminConfigService.InitDefaultConfigs()

    // 管理端路由组：Auth + Admin 双重中间件
    admin := r.Group("/api/admin")
    admin.Use(middleware.Auth(), middleware.Admin())
    {
        // 仪表盘
        admin.GET("/dashboard/stats", handler.AdminGetDashboardStats)
        admin.GET("/dashboard/trends", handler.AdminGetDashboardTrends)
        admin.GET("/dashboard/recent-logs", handler.AdminGetRecentLogs)

        // 用户管理
        admin.GET("/users", handler.AdminGetUsers)
        admin.GET("/users/:id", handler.AdminGetUserDetail)
        admin.PUT("/users/:id/status", handler.AdminUpdateUserStatus)
        admin.POST("/users/:id/adjust-balance", handler.AdminAdjustBalance)
        admin.POST("/users/:id/reset-password", handler.AdminResetPassword)

        // 订单管理
        admin.GET("/orders", handler.AdminGetOrders)
        admin.GET("/orders/summary", handler.AdminGetOrderSummary)

        // 交易流水
        admin.GET("/transactions", handler.AdminGetTransactions)

        // 公告管理
        admin.GET("/announcements", handler.AdminGetAnnouncements)
        admin.POST("/announcements", handler.AdminCreateAnnouncement)
        admin.DELETE("/announcements/:id", handler.AdminDeleteAnnouncement)

        // 系统配置
        admin.GET("/configs", handler.AdminGetConfigs)
        admin.PUT("/configs", handler.AdminUpdateConfigs)

        // 操作日志
        admin.GET("/audit-logs", handler.AdminGetAuditLogs)
        admin.GET("/audit-logs/:id", handler.AdminGetAuditLogDetail)
    }
}
```

---

## 9. 错误码扩展

**文件：`internal/utils/response.go` — 新增管理端错误码**

```go
const (
    // ... 现有错误码 ...

    // 管理端 3001-3099
    CodeAdminForbidden      = 3001  // 无管理权限
    CodeAdminUserNotFound   = 3002  // 管理端用户不存在
    CodeAdminInvalidAction  = 3003  // 无效的管理操作
    CodeAdminConfigNotFound = 3004  // 配置项不存在
    CodeAdminAuditNotFound  = 3005  // 审计日志不存在
    CodeAdminNoTargetUsers  = 3006  // 没有符合条件的目标用户
)
```

---

## 10. CORS 配置更新

管理端前端（`localhost:3001`）需要跨域访问 BFF（`localhost:8080`）。

**文件：`internal/middleware/cors.go` — 确认 Origin 包含管理端**

```go
func CORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        // 允许的 Origin 列表（生产环境应严格限定）
        allowedOrigins := []string{
            "http://localhost:8081",  // 用户端
            "http://localhost:3001",  // 管理端
        }

        for _, allowed := range allowedOrigins {
            if origin == allowed {
                c.Header("Access-Control-Allow-Origin", origin)
                break
            }
        }

        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        c.Header("Access-Control-Allow-Credentials", "true")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    }
}
```

---

## 11. API 接口汇总

### 11.1 全部 18 个管理端接口

| # | 方法 | 路径 | Handler | 说明 |
|---|------|------|---------|------|
| 1 | GET | `/api/admin/dashboard/stats` | AdminGetDashboardStats | 仪表盘指标 |
| 2 | GET | `/api/admin/dashboard/trends` | AdminGetDashboardTrends | 趋势图数据 |
| 3 | GET | `/api/admin/dashboard/recent-logs` | AdminGetRecentLogs | 最近操作 |
| 4 | GET | `/api/admin/users` | AdminGetUsers | 用户列表 |
| 5 | GET | `/api/admin/users/:id` | AdminGetUserDetail | 用户详情 |
| 6 | PUT | `/api/admin/users/:id/status` | AdminUpdateUserStatus | 封禁/解封 |
| 7 | POST | `/api/admin/users/:id/adjust-balance` | AdminAdjustBalance | 手动调账 |
| 8 | POST | `/api/admin/users/:id/reset-password` | AdminResetPassword | 重置密码 |
| 9 | GET | `/api/admin/orders` | AdminGetOrders | 订单列表 |
| 10 | GET | `/api/admin/orders/summary` | AdminGetOrderSummary | 订单统计 |
| 11 | GET | `/api/admin/transactions` | AdminGetTransactions | 交易流水 |
| 12 | GET | `/api/admin/announcements` | AdminGetAnnouncements | 公告列表 |
| 13 | POST | `/api/admin/announcements` | AdminCreateAnnouncement | 发送公告 |
| 14 | DELETE | `/api/admin/announcements/:id` | AdminDeleteAnnouncement | 删除公告 |
| 15 | GET | `/api/admin/configs` | AdminGetConfigs | 获取配置 |
| 16 | PUT | `/api/admin/configs` | AdminUpdateConfigs | 更新配置 |
| 17 | GET | `/api/admin/audit-logs` | AdminGetAuditLogs | 操作日志列表 |
| 18 | GET | `/api/admin/audit-logs/:id` | AdminGetAuditLogDetail | 日志详情 |

### 11.2 鉴权链路

```
请求 → CORS → RateLimiter → Auth (JWT 验证) → Admin (role 检查) → Handler
```

所有 18 个接口均需通过 `Auth + Admin` 双重中间件。

---

## 12. 测试用例

```bash
# 先用管理员账号登录获取 Token
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gennovel.com","password":"admin123"}' \
  | jq -r '.data.token')

# 1. 仪表盘统计
curl -s "http://localhost:8080/api/admin/dashboard/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 2. 趋势图（用户增长，30天）
curl -s "http://localhost:8080/api/admin/dashboard/trends?type=users&days=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 3. 用户列表（搜索 + 分页）
curl -s "http://localhost:8080/api/admin/users?keyword=alice&page=1&page_size=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 4. 用户详情
curl -s "http://localhost:8080/api/admin/users/2" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 5. 封禁用户
curl -s -X PUT "http://localhost:8080/api/admin/users/3/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": 0, "reason": "违规操作"}' | jq

# 6. 手动调账
curl -s -X POST "http://localhost:8080/api/admin/users/2/adjust-balance" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "increase", "amount": 500, "reason": "客服补偿"}' | jq

# 7. 重置密码
curl -s -X POST "http://localhost:8080/api/admin/users/2/reset-password" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"send_email": true}' | jq

# 8. 订单列表
curl -s "http://localhost:8080/api/admin/orders?status=1&page=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 9. 订单统计
curl -s "http://localhost:8080/api/admin/orders/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 10. 交易流水
curl -s "http://localhost:8080/api/admin/transactions?type=recharge&page=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 11. 发送公告
curl -s -X POST "http://localhost:8080/api/admin/announcements" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"notice","title":"系统维护通知","content":"明天凌晨维护","target":"all"}' | jq

# 12. 获取配置
curl -s "http://localhost:8080/api/admin/configs" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 13. 更新配置
curl -s -X PUT "http://localhost:8080/api/admin/configs" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"configs":[{"config_key":"registration.gift_points","config_value":2000}]}' | jq

# 14. 操作日志
curl -s "http://localhost:8080/api/admin/audit-logs?page=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# 15. 普通用户访问管理接口 → 403
curl -s "http://localhost:8080/api/admin/dashboard/stats" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
# 预期: {"code": 403, "message": "无管理权限"}
```

---

## 13. 开发任务拆分

### Phase 1: 数据层与鉴权 (1 天) ✅

- [x] `internal/model/user.go` — User 新增 Role 字段 + 常量
- [x] `internal/model/admin.go` — AdminAuditLog、SystemConfig 模型
- [x] `internal/database/database.go` — AutoMigrate + 索引
- [x] `internal/utils/jwt.go` — TokenClaims 新增 Role
- [x] `internal/service/auth_service.go` — Login/Register 适配 role
- [x] `internal/middleware/admin.go` — AdminMiddleware
- [x] `internal/dto/admin.go` — 全部管理端 DTO
- [x] `internal/utils/response.go` — 管理端错误码
- [x] SQL 迁移脚本：users 表加 role 列 + 手动设置首个管理员

### Phase 2: 审计日志 + 系统配置 (0.5 天) ✅

- [x] `internal/service/admin_audit_service.go` — 审计日志 CRUD
- [x] `internal/service/admin_config_service.go` — 系统配置 CRUD + 默认值初始化
- [x] `internal/handler/admin_audit_handler.go` — 日志列表 + 详情接口
- [x] `internal/handler/admin_config_handler.go` — 获取 + 更新配置接口

### Phase 3: 仪表盘 (0.5 天) ✅

- [x] `internal/service/admin_dashboard_service.go` — 统计指标 + 趋势图 + 最近操作
- [x] `internal/handler/admin_dashboard_handler.go` — 3 个仪表盘接口

### Phase 4: 用户管理 (1 天) ✅

- [x] `internal/service/admin_user_service.go` — 列表/详情/封禁/调账/重置密码
- [x] `internal/handler/admin_user_handler.go` — 5 个用户管理接口
- [x] 调账复用 BalanceService.Credit/Deduct
- [x] 重置密码 + 邮件通知

### Phase 5: 订单 + 交易 + 公告 (1 天) ✅

- [x] `internal/service/admin_order_service.go` — 订单列表 + 统计 + 交易列表
- [x] `internal/handler/admin_order_handler.go` — 3 个接口
- [x] `internal/service/admin_announce_service.go` — 公告列表 + 发送 + 删除
- [x] `internal/handler/admin_announce_handler.go` — 3 个接口

### Phase 6: 路由注册 + CORS + 联调 (0.5 天) ✅

- [x] `cmd/server/main.go` — 注册全部 18 个管理端路由
- [x] `internal/middleware/cors.go` — 允许管理端 Origin
- [x] 18 个接口逐一 curl 验证
- [x] 权限验证：普通用户访问 /api/admin/* 返回 403

### Phase 7: 测试 (0.5 天) ✅

- [x] 封禁后用户无法访问 API
- [x] 调账后余额和交易记录正确
- [x] 公告群发后所有用户可收到
- [x] 配置修改后立即生效
- [x] 所有操作有审计日志

---

## 14. 注意事项

### 14.1 与现有代码的一致性

- 遵循现有 Handler → Service → Model 三层架构
- Service 通过包级变量 + Init 函数注入
- 响应格式统一使用 `utils.Success/BadRequest/InternalError`
- 数据库操作使用 `database.GetDB()` 获取全局连接
- 事务操作使用 `db.Transaction(func(tx *gorm.DB) error { ... })`

### 14.2 管理端与用户端的隔离

- 管理端路由前缀 `/api/admin/*`，用户端 `/api/v1/*`
- AdminMiddleware 仅应用于管理端路由组
- 管理端 Service 以 `admin_` 前缀命名，避免与用户端冲突
- 管理端 Handler 函数以 `Admin` 前缀命名

### 14.3 安全要求

- 所有管理操作写入 `admin_audit_logs`，不可跳过
- 封禁/调账/群发等危险操作需前端二次确认（后端无需额外确认）
- 首个管理员通过数据库手动设置 `role='admin'`
- 生产环境 CORS 应严格限定管理端域名

### 14.4 性能要求

- 列表查询：每页 20 条，使用数据库索引，响应 < 500ms
- 仪表盘统计：多个 COUNT/SUM 查询并行执行，响应 < 1s
- 趋势图：按日分组聚合，最多 90 天数据点
- 群发公告：分批插入（每批 500 条），避免单次插入过大

---

*文档版本：1.0*
*创建日期：2026-02-07*
*最后更新：2026-02-07*
*作者：Claude*
