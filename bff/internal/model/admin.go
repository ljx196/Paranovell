package model

import (
	"encoding/json"
	"time"
)

// AdminAuditLog 管理操作审计日志
type AdminAuditLog struct {
	ID         uint            `gorm:"primaryKey" json:"id"`
	AdminID    uint            `gorm:"not null;index" json:"admin_id"`
	Action     string          `gorm:"size:50;not null;index" json:"action"`
	TargetType string          `gorm:"size:30;not null" json:"target_type"`
	TargetID   string          `gorm:"size:100" json:"target_id"`
	Detail     json.RawMessage `gorm:"type:jsonb" json:"detail"`
	IPAddress  string          `gorm:"size:45" json:"ip_address"`
	CreatedAt  time.Time       `gorm:"index" json:"created_at"`
}

func (AdminAuditLog) TableName() string {
	return "bff_schema.admin_audit_logs"
}

// SystemConfig 系统运行时配置
type SystemConfig struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	ConfigKey   string          `gorm:"uniqueIndex;size:100;not null" json:"config_key"`
	ConfigValue json.RawMessage `gorm:"type:jsonb;not null" json:"config_value"`
	Description string          `gorm:"size:200" json:"description"`
	UpdatedBy   uint            `json:"updated_by"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

func (SystemConfig) TableName() string {
	return "bff_schema.system_configs"
}

// 操作类型常量
const (
	AuditUserDisable   = "user.disable"
	AuditUserEnable    = "user.enable"
	AuditUserResetPwd  = "user.reset_password"
	AuditUserAdjustBal = "user.adjust_balance"
	AuditOrderRefund   = "order.refund"
	AuditMsgBroadcast  = "message.broadcast"
	AuditMsgDelete     = "message.delete"
	AuditConfigUpdate  = "config.update"

	// 内容审查相关
	AuditContentReview   = "content.review"
	AuditContentDelete   = "content.delete_conversation"
	AuditContentScan     = "content.scan"
	AuditSensitiveCreate = "sensitive_word.create"
	AuditSensitiveUpdate = "sensitive_word.update"
	AuditSensitiveDelete = "sensitive_word.delete"
)

// 操作对象类型常量
const (
	TargetTypeUser    = "user"
	TargetTypeOrder   = "order"
	TargetTypeMessage = "message"
	TargetTypeConfig       = "config"
	TargetTypeConversation = "conversation"
	TargetTypeSensitive    = "sensitive_word"
)

// AuditActionLabels 操作类型中文标签
var AuditActionLabels = map[string]string{
	AuditUserDisable:   "封禁用户",
	AuditUserEnable:    "解封用户",
	AuditUserResetPwd:  "重置密码",
	AuditUserAdjustBal: "手动调账",
	AuditOrderRefund:   "订单退款",
	AuditMsgBroadcast:  "群发公告",
	AuditMsgDelete:     "删除公告",
	AuditConfigUpdate:    "修改配置",
	AuditContentReview:   "审查对话",
	AuditContentDelete:   "删除违规对话",
	AuditContentScan:     "内容扫描",
	AuditSensitiveCreate: "新增敏感词",
	AuditSensitiveUpdate: "修改敏感词",
	AuditSensitiveDelete: "删除敏感词",
}
