package service

import (
	"fmt"
	"time"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

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
		err := db.Model(&model.User{}).
			Select("TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as value").
			Where("created_at >= ? AND deleted_at IS NULL", startDate).
			Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
			Order("date ASC").
			Scan(&results).Error
		return results, err

	case "revenue":
		err := db.Model(&model.RechargeOrder{}).
			Select("TO_CHAR(paid_at, 'YYYY-MM-DD') as date, COALESCE(SUM(amount_yuan), 0) as value").
			Where("status = ? AND paid_at >= ?", model.OrderStatusPaid, startDate).
			Group("TO_CHAR(paid_at, 'YYYY-MM-DD')").
			Order("date ASC").
			Scan(&results).Error
		return results, err

	case "tokens":
		err := db.Model(&model.TokenUsage{}).
			Select("TO_CHAR(created_at, 'YYYY-MM-DD') as date, COALESCE(SUM(total_tokens), 0) as value").
			Where("created_at >= ?", startDate).
			Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
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
