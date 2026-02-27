package service

import (
	"fmt"
	"time"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

type AdminAnnounceService struct {
	auditService *AdminAuditService
}

func NewAdminAnnounceService(as *AdminAuditService) *AdminAnnounceService {
	return &AdminAnnounceService{auditService: as}
}

// List 公告列表
func (s *AdminAnnounceService) List(req *dto.AdminAnnouncementListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	// 使用子查询获取公告（按 title+content+msg_type+created_at 去重分组）
	query := db.Table("bff_schema.system_messages")

	if req.MsgType != "" {
		query = query.Where("msg_type = ?", req.MsgType)
	}
	if req.StartDate != "" {
		query = query.Where("created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
	}

	// 公告的逻辑：同一批次发送的消息具有相同的 title + content + msg_type + 相近的 created_at
	// 这里按 title, msg_type 分组统计
	type announcementRow struct {
		Title       string `gorm:"column:title"`
		Content     string `gorm:"column:content"`
		MsgType     string `gorm:"column:msg_type"`
		MinID       uint   `gorm:"column:min_id"`
		TargetCount int64  `gorm:"column:target_count"`
		ReadCount   int64  `gorm:"column:read_count"`
		CreatedAt   string `gorm:"column:created_at"`
	}

	// Count distinct announcements
	var total int64
	countQuery := db.Table("bff_schema.system_messages").
		Select("COUNT(DISTINCT (title || '||' || content || '||' || msg_type))")
	if req.MsgType != "" {
		countQuery = countQuery.Where("msg_type = ?", req.MsgType)
	}
	if req.StartDate != "" {
		countQuery = countQuery.Where("created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		countQuery = countQuery.Where("created_at < ?", req.EndDate+" 23:59:59")
	}
	countQuery.Scan(&total)

	var rows []announcementRow
	groupQuery := query.
		Select("title, content, msg_type, MIN(id) as min_id, COUNT(*) as target_count, SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count, TO_CHAR(MIN(created_at), 'YYYY-MM-DD HH24:MI') as created_at").
		Group("title, content, msg_type").
		Order("MIN(created_at) DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize())

	if err := groupQuery.Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]dto.AdminAnnouncementListItem, len(rows))
	for i, r := range rows {
		target := "all"
		if r.TargetCount <= 10 {
			target = "specific"
		}
		items[i] = dto.AdminAnnouncementListItem{
			ID:          r.MinID,
			MsgType:     r.MsgType,
			Title:       r.Title,
			Content:     r.Content,
			Target:      target,
			TargetCount: r.TargetCount,
			ReadCount:   r.ReadCount,
			CreatedAt:   r.CreatedAt,
		}
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// Create 发送公告（批量写入 system_messages）
func (s *AdminAnnounceService) Create(adminID uint, req *dto.CreateAnnouncementRequest, ip string) error {
	db := database.GetDB()

	var userIDs []uint

	if req.Target == "all" {
		// 所有活跃用户
		db.Model(&model.User{}).
			Where("status = 1 AND deleted_at IS NULL").
			Pluck("id", &userIDs)
	} else {
		// 指定邮箱用户
		if len(req.TargetEmails) == 0 {
			return fmt.Errorf("target_emails is required when target is specific")
		}
		db.Model(&model.User{}).
			Where("email IN ? AND deleted_at IS NULL", req.TargetEmails).
			Pluck("id", &userIDs)
	}

	if len(userIDs) == 0 {
		return fmt.Errorf("no target users found")
	}

	// 批量插入消息
	now := time.Now()
	messages := make([]model.SystemMessage, len(userIDs))
	for i, uid := range userIDs {
		messages[i] = model.SystemMessage{
			UserID:    uid,
			Title:     req.Title,
			Content:   req.Content,
			MsgType:   req.MsgType,
			IsRead:    false,
			CreatedAt: now,
		}
	}

	if err := db.CreateInBatches(messages, 100).Error; err != nil {
		return err
	}

	// 审计日志
	s.auditService.Record(adminID, model.AuditMsgBroadcast,
		model.TargetTypeMessage, fmt.Sprintf("batch:%d", len(userIDs)),
		map[string]interface{}{
			"title":        req.Title,
			"msg_type":     req.MsgType,
			"target":       req.Target,
			"target_count": len(userIDs),
		}, ip)

	return nil
}

// Delete 删除公告（按 title+content+msg_type 删除同批次消息）
func (s *AdminAnnounceService) Delete(adminID uint, announcementID uint, ip string) error {
	db := database.GetDB()

	// 先查找该消息
	var msg model.SystemMessage
	if err := db.First(&msg, announcementID).Error; err != nil {
		return fmt.Errorf("announcement not found")
	}

	// 删除同批次所有消息（相同 title + content + msg_type）
	result := db.Where("title = ? AND content = ? AND msg_type = ?",
		msg.Title, msg.Content, msg.MsgType).
		Delete(&model.SystemMessage{})
	if result.Error != nil {
		return result.Error
	}

	// 审计日志
	s.auditService.Record(adminID, model.AuditMsgDelete,
		model.TargetTypeMessage, fmt.Sprintf("%d", announcementID),
		map[string]interface{}{
			"title":         msg.Title,
			"msg_type":      msg.MsgType,
			"deleted_count": result.RowsAffected,
		}, ip)

	return nil
}
