package service

import (
	"encoding/json"
	"fmt"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
)

type AdminAuditService struct{}

func NewAdminAuditService() *AdminAuditService {
	return &AdminAuditService{}
}

// Record 写入审计日志（异步调用，不在事务内）
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

	// 批量查询管理员邮箱
	adminIDs := extractAdminIDs(logs)
	emailMap := s.getAdminEmails(adminIDs)

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
	case model.AuditUserDisable, model.AuditUserEnable:
		return fmt.Sprintf("原因: %v", detail["reason"])
	case model.AuditUserAdjustBal:
		return fmt.Sprintf("%v %v: %v", detail["type"], detail["amount"], detail["reason"])
	case model.AuditMsgBroadcast:
		return fmt.Sprintf("%v", detail["title"])
	case model.AuditConfigUpdate:
		if detail != nil {
			return fmt.Sprintf("更新 %d 项配置", len(detail))
		}
		return "更新配置"
	case model.AuditUserResetPwd:
		return fmt.Sprintf("用户: %v", detail["user_email"])
	default:
		return ""
	}
}

// extractAdminIDs 从审计日志列表中提取去重的管理员 ID
func extractAdminIDs(logs []model.AdminAuditLog) []uint {
	idMap := make(map[uint]bool)
	for _, l := range logs {
		idMap[l.AdminID] = true
	}
	ids := make([]uint, 0, len(idMap))
	for id := range idMap {
		ids = append(ids, id)
	}
	return ids
}
