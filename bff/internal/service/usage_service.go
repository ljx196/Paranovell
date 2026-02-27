package service

import (
	"time"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
)

type UsageService struct{}

func NewUsageService() *UsageService {
	return &UsageService{}
}

// GetUsageSummary 获取用量汇总
func (s *UsageService) GetUsageSummary(userID uint) (*dto.UsageSummaryResponse, error) {
	db := database.GetDB()

	var result struct {
		TotalInput  int64
		TotalOutput int64
		TotalTokens int64
	}

	err := db.Model(&model.TokenUsage{}).
		Select("COALESCE(SUM(input_tokens), 0) as total_input, COALESCE(SUM(output_tokens), 0) as total_output, COALESCE(SUM(total_tokens), 0) as total_tokens").
		Where("user_id = ?", userID).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	return &dto.UsageSummaryResponse{
		TotalInputTokens:  result.TotalInput,
		TotalOutputTokens: result.TotalOutput,
		TotalTokens:       result.TotalTokens,
	}, nil
}

// GetDailyUsage 获取每日用量（最近30天）
func (s *UsageService) GetDailyUsage(userID uint, days int) ([]dto.DailyUsageResponse, error) {
	db := database.GetDB()

	if days <= 0 {
		days = 30
	}

	startDate := time.Now().AddDate(0, 0, -days)

	var results []struct {
		Date         string
		InputTokens  int64
		OutputTokens int64
		TotalTokens  int64
	}

	err := db.Model(&model.TokenUsage{}).
		Select("DATE(created_at) as date, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(total_tokens) as total_tokens").
		Where("user_id = ? AND created_at >= ?", userID, startDate).
		Group("DATE(created_at)").
		Order("date DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	dailyUsage := make([]dto.DailyUsageResponse, len(results))
	for i, r := range results {
		dailyUsage[i] = dto.DailyUsageResponse{
			Date:         r.Date,
			InputTokens:  r.InputTokens,
			OutputTokens: r.OutputTokens,
			TotalTokens:  r.TotalTokens,
		}
	}

	return dailyUsage, nil
}

// GetUsageDetail 获取用量明细
func (s *UsageService) GetUsageDetail(userID uint, days int) (*dto.UsageDetailResponse, error) {
	daily, err := s.GetDailyUsage(userID, days)
	if err != nil {
		return nil, err
	}

	summary, err := s.GetUsageSummary(userID)
	if err != nil {
		return nil, err
	}

	return &dto.UsageDetailResponse{
		Daily: daily,
		Total: *summary,
	}, nil
}

// GetConversationRanking 按会话统计消费排行
func (s *UsageService) GetConversationRanking(userID uint, req *dto.ConversationRankingRequest) (*dto.ConversationRankingResponse, error) {
	db := database.GetDB()

	startDate := time.Now().AddDate(0, 0, -req.GetDays())

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

	db.Table("(?) as sub", baseQuery).Count(&total)

	err := baseQuery.
		Order("total_points DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	convIDs := make([]uint, len(results))
	for i, r := range results {
		convIDs[i] = r.ConversationID
	}

	titleMap := s.getConversationTitles(db, convIDs)

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

	if days <= 0 {
		days = 7
	}

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
