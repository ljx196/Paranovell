package dto

// ==================== 通用分页 ====================

// AdminPaginationRequest 管理端通用分页请求
type AdminPaginationRequest struct {
	Page     int `form:"page" binding:"omitempty,min=1"`
	PageSize int `form:"page_size" binding:"omitempty,min=1,max=100"`
}

func (r *AdminPaginationRequest) GetPage() int {
	if r.Page <= 0 {
		return 1
	}
	return r.Page
}

func (r *AdminPaginationRequest) GetPageSize() int {
	if r.PageSize <= 0 {
		return 20
	}
	return r.PageSize
}

func (r *AdminPaginationRequest) GetOffset() int {
	return (r.GetPage() - 1) * r.GetPageSize()
}

// PaginatedResult 通用分页响应
type PaginatedResult struct {
	Total int64       `json:"total"`
	Items interface{} `json:"items"`
}

// ==================== 仪表盘 ====================

// DashboardStatsResponse 仪表盘统计指标
type DashboardStatsResponse struct {
	TotalUsers           int64   `json:"total_users"`
	TodayActive          int64   `json:"today_active"`
	TodayNewUsers        int64   `json:"today_new_users"`
	TodayRevenueYuan     float64 `json:"today_revenue_yuan"`
	YesterdayActive      int64   `json:"yesterday_active"`
	YesterdayNewUsers    int64   `json:"yesterday_new_users"`
	YesterdayRevenueYuan float64 `json:"yesterday_revenue_yuan"`
}

// TrendRequest 趋势图请求
type TrendRequest struct {
	Type string `form:"type" binding:"required,oneof=users revenue tokens"`
	Days int    `form:"days" binding:"required,oneof=7 30 90"`
}

// TrendItem 趋势数据点
type TrendItem struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
}

// RecentLogResponse 最近操作日志（仪表盘用）
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

// AdminUserListRequest 用户列表请求
type AdminUserListRequest struct {
	AdminPaginationRequest
	Keyword   string `form:"keyword"`
	Status    *int8  `form:"status"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}

// AdminUserListItem 用户列表项
type AdminUserListItem struct {
	ID        uint   `json:"id"`
	Email     string `json:"email"`
	Nickname  string `json:"nickname"`
	AvatarURL string `json:"avatar_url"`
	Status    int8   `json:"status"`
	Role      string `json:"role"`
	Balance   int64  `json:"balance"`
	CreatedAt string `json:"created_at"`
}

// AdminUserDetailResponse 用户详情
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
	Balance       struct {
		Balance        int64 `json:"balance"`
		TotalRecharged int64 `json:"total_recharged"`
		TotalConsumed  int64 `json:"total_consumed"`
		TotalGifted    int64 `json:"total_gifted"`
	} `json:"balance"`
	RecentTransactions []AdminTransactionItem `json:"recent_transactions"`
}

// UpdateUserStatusRequest 封禁/解封请求
type UpdateUserStatusRequest struct {
	Status int8   `json:"status" binding:"oneof=0 1"`
	Reason string `json:"reason" binding:"required,min=2"`
}

// AdjustBalanceRequest 调账请求
type AdjustBalanceRequest struct {
	Type   string `json:"type" binding:"required,oneof=increase decrease"`
	Amount int64  `json:"amount" binding:"required,gt=0"`
	Reason string `json:"reason" binding:"required,min=2"`
}

// AdminResetPasswordRequest 管理员重置密码请求
type AdminResetPasswordRequest struct {
	SendEmail bool `json:"send_email"`
}

// ==================== 订单管理 ====================

// AdminOrderListRequest 订单列表请求
type AdminOrderListRequest struct {
	AdminPaginationRequest
	Status        *int8  `form:"status"`
	PaymentMethod string `form:"payment_method"`
	UserEmail     string `form:"user_email"`
	StartDate     string `form:"start_date"`
	EndDate       string `form:"end_date"`
}

// AdminOrderListItem 订单列表项
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

// AdminOrderSummaryResponse 订单统计概要
type AdminOrderSummaryResponse struct {
	TotalCount      int64   `json:"total_count"`
	PaidAmount      float64 `json:"paid_amount"`
	PendingAmount   float64 `json:"pending_amount"`
	CancelledAmount float64 `json:"cancelled_amount"`
	RefundedAmount  float64 `json:"refunded_amount"`
}

// ==================== 交易流水 ====================

// AdminTransactionListRequest 交易流水列表请求
type AdminTransactionListRequest struct {
	AdminPaginationRequest
	Type      string `form:"type" binding:"omitempty,oneof=recharge consumption gift referral refund"`
	UserEmail string `form:"user_email"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}

// AdminTransactionItem 交易流水项
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

// AdminAnnouncementListRequest 公告列表请求
type AdminAnnouncementListRequest struct {
	AdminPaginationRequest
	MsgType   string `form:"msg_type" binding:"omitempty,oneof=notice account usage"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}

// AdminAnnouncementListItem 公告列表项
type AdminAnnouncementListItem struct {
	ID          uint   `json:"id"`
	MsgType     string `json:"msg_type"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Target      string `json:"target"`
	TargetCount int64  `json:"target_count"`
	ReadCount   int64  `json:"read_count"`
	CreatedAt   string `json:"created_at"`
}

// CreateAnnouncementRequest 发送公告请求
type CreateAnnouncementRequest struct {
	MsgType      string   `json:"msg_type" binding:"required,oneof=notice account usage"`
	Title        string   `json:"title" binding:"required,max=100"`
	Content      string   `json:"content" binding:"required,max=2000"`
	Target       string   `json:"target" binding:"required,oneof=all specific"`
	TargetEmails []string `json:"target_emails"`
}

// ==================== 系统配置 ====================

// AdminConfigItem 配置项
type AdminConfigItem struct {
	ConfigKey   string      `json:"config_key"`
	ConfigValue interface{} `json:"config_value"`
	Description string      `json:"description"`
	UpdatedBy   uint        `json:"updated_by"`
	UpdatedAt   string      `json:"updated_at"`
}

// UpdateConfigsRequest 批量更新配置请求
type UpdateConfigsRequest struct {
	Configs []ConfigUpdateItem `json:"configs" binding:"required,min=1"`
}

// ConfigUpdateItem 配置更新项
type ConfigUpdateItem struct {
	ConfigKey   string      `json:"config_key" binding:"required"`
	ConfigValue interface{} `json:"config_value" binding:"required"`
}

// ==================== 操作日志 ====================

// AdminAuditLogListRequest 审计日志列表请求
type AdminAuditLogListRequest struct {
	AdminPaginationRequest
	Action     string `form:"action"`
	AdminID    *uint  `form:"admin_id"`
	TargetType string `form:"target_type"`
	StartDate  string `form:"start_date"`
	EndDate    string `form:"end_date"`
}

// AdminAuditLogListItem 审计日志列表项
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

// AdminAuditLogDetailResponse 审计日志详情
type AdminAuditLogDetailResponse struct {
	AdminAuditLogListItem
	Detail interface{} `json:"detail"`
}
