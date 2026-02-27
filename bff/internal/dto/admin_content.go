package dto

// ==================== 对话审查 ====================

// AdminConversationListRequest 对话列表请求
type AdminConversationListRequest struct {
	AdminPaginationRequest
	UserID       *uint  `form:"user_id"`
	UserEmail    string `form:"user_email"`
	ReviewStatus string `form:"review_status" binding:"omitempty,oneof=pending approved violated dismissed"`
	OnlyFlagged  *bool  `form:"only_flagged"`
}

// AdminConversationListItem 对话列表项
type AdminConversationListItem struct {
	ConversationID string                     `json:"conversation_id"`
	Title          string                     `json:"title"`
	UserID         uint                       `json:"user_id"`
	UserEmail      string                     `json:"user_email"`
	UserNickname   string                     `json:"user_nickname"`
	Model          string                     `json:"model"`
	MessageCount   int                        `json:"message_count"`
	CreatedAt      string                     `json:"created_at"`
	UpdatedAt      string                     `json:"updated_at"`
	Review         *AdminConversationReviewVO `json:"review"`
}

// AdminConversationReviewVO 对话关联的审查信息
type AdminConversationReviewVO struct {
	ID         uint   `json:"id"`
	Status     string `json:"status"`
	FlagType   string `json:"flag_type"`
	FlagReason string `json:"flag_reason"`
	CreatedAt  string `json:"created_at"`
}

// AdminConversationMessagesRequest 获取对话消息请求
type AdminConversationMessagesRequest struct {
	AdminPaginationRequest
	UserID uint `form:"user_id" binding:"required"`
}

// AdminMessageItem 消息项
type AdminMessageItem struct {
	ID        string `json:"id"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

// AdminFlagRequest 手动标记请求
type AdminFlagRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Reason string `json:"reason" binding:"required,min=2"`
}

// AdminReviewRequest 提交审查请求
type AdminReviewRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Status string `json:"status" binding:"required,oneof=approved violated dismissed"`
	Action string `json:"action" binding:"omitempty,oneof=none delete_conversation ban_user"`
	Reason string `json:"reason"`
}

// AdminReviewListRequest 审查记录列表请求
type AdminReviewListRequest struct {
	AdminPaginationRequest
	Status    string `form:"status" binding:"omitempty,oneof=pending approved violated dismissed"`
	FlagType  string `form:"flag_type" binding:"omitempty,oneof=manual auto"`
	UserID    *uint  `form:"user_id"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}

// AdminReviewListItem 审查记录列表项
type AdminReviewListItem struct {
	ID             uint   `json:"id"`
	ConversationID string `json:"conversation_id"`
	UserID         uint   `json:"user_id"`
	UserEmail      string `json:"user_email"`
	Status         string `json:"status"`
	FlagType       string `json:"flag_type"`
	FlagReason     string `json:"flag_reason"`
	ReviewerEmail  string `json:"reviewer_email,omitempty"`
	ReviewedAt     string `json:"reviewed_at,omitempty"`
	ActionTaken    string `json:"action_taken"`
	CreatedAt      string `json:"created_at"`
}

// ==================== 敏感词 ====================

// AdminSensitiveWordListRequest 敏感词列表请求
type AdminSensitiveWordListRequest struct {
	AdminPaginationRequest
	Category  string `form:"category" binding:"omitempty,oneof=violence porn politics ad other"`
	Keyword   string `form:"keyword"`
	IsEnabled *bool  `form:"is_enabled"`
}

// AdminSensitiveWordItem 敏感词列表项
type AdminSensitiveWordItem struct {
	ID           uint   `json:"id"`
	Word         string `json:"word"`
	Category     string `json:"category"`
	IsEnabled    bool   `json:"is_enabled"`
	CreatedBy    uint   `json:"created_by"`
	CreatorEmail string `json:"creator_email"`
	CreatedAt    string `json:"created_at"`
}

// AdminBatchCreateSensitiveWordsRequest 批量添加敏感词请求
type AdminBatchCreateSensitiveWordsRequest struct {
	Words []SensitiveWordInput `json:"words" binding:"required,min=1"`
}

// SensitiveWordInput 敏感词输入
type SensitiveWordInput struct {
	Word     string `json:"word" binding:"required,min=1,max=100"`
	Category string `json:"category" binding:"omitempty,oneof=violence porn politics ad other"`
}

// AdminBatchCreateSensitiveWordsResponse 批量添加敏感词响应
type AdminBatchCreateSensitiveWordsResponse struct {
	Created    int      `json:"created"`
	Duplicates []string `json:"duplicates"`
}

// AdminUpdateSensitiveWordRequest 修改敏感词请求
type AdminUpdateSensitiveWordRequest struct {
	Word      string `json:"word" binding:"omitempty,min=1,max=100"`
	Category  string `json:"category" binding:"omitempty,oneof=violence porn politics ad other"`
	IsEnabled *bool  `json:"is_enabled"`
}

// ==================== 内容扫描 ====================

// AdminScanRequest 触发扫描请求
type AdminScanRequest struct {
	UserID           uint `json:"user_id"`
	Days             int  `json:"days" binding:"omitempty,min=1,max=30"`
	MaxConversations int  `json:"max_conversations" binding:"omitempty,min=1,max=500"`
}

func (r *AdminScanRequest) GetDays() int {
	if r.Days <= 0 {
		return 7
	}
	return r.Days
}

func (r *AdminScanRequest) GetMaxConversations() int {
	if r.MaxConversations <= 0 {
		return 100
	}
	return r.MaxConversations
}

// AdminScanResponse 扫描结果响应
type AdminScanResponse struct {
	ScannedConversations int                    `json:"scanned_conversations"`
	ScannedMessages      int                    `json:"scanned_messages"`
	FlaggedConversations int                    `json:"flagged_conversations"`
	FlaggedDetails       []AdminScanFlaggedItem `json:"flagged_details"`
}

// AdminScanFlaggedItem 扫描标记项
type AdminScanFlaggedItem struct {
	ConversationID string   `json:"conversation_id"`
	UserID         uint     `json:"user_id"`
	UserEmail      string   `json:"user_email"`
	MatchedWords   []string `json:"matched_words"`
	ReviewID       uint     `json:"review_id"`
}
