package service

import (
	"fmt"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

// AdminReferralService 邀请管理服务
type AdminReferralService struct{}

// NewAdminReferralService 创建邀请管理服务
func NewAdminReferralService() *AdminReferralService {
	return &AdminReferralService{}
}

// GetStats 邀请统计概览
func (s *AdminReferralService) GetStats() (*dto.AdminReferralStatsResponse, error) {
	db := database.GetDB()

	var totalReferrals int64
	db.Model(&model.Referral{}).Count(&totalReferrals)

	// 总奖励积分（type=referral 的正数交易）
	var totalRewardsPoints int64
	db.Model(&model.Transaction{}).
		Where("type = ?", model.TxTypeReferral).
		Where("amount > 0").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRewardsPoints)

	// 今日邀请
	var todayReferrals int64
	db.Model(&model.Referral{}).
		Where("created_at >= CURRENT_DATE").
		Count(&todayReferrals)

	// 今日奖励积分
	var todayRewardsPoints int64
	db.Model(&model.Transaction{}).
		Where("type = ? AND amount > 0 AND created_at >= CURRENT_DATE", model.TxTypeReferral).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&todayRewardsPoints)

	// 有效邀请率（被邀请人有消费记录的比例）
	var activeReferralRate float64
	if totalReferrals > 0 {
		var activeReferees int64
		db.Raw(`
			SELECT COUNT(DISTINCT r.referee_id)
			FROM bff_schema.referrals r
			JOIN bff_schema.user_balance ub ON ub.user_id = r.referee_id
			WHERE ub.total_consumed > 0
		`).Scan(&activeReferees)
		activeReferralRate = float64(activeReferees) / float64(totalReferrals)
	}

	// Top 邀请人（前10）
	type topRow struct {
		UserID        uint   `gorm:"column:user_id"`
		Email         string `gorm:"column:email"`
		Nickname      string `gorm:"column:nickname"`
		ReferralCount int64  `gorm:"column:referral_count"`
		TotalEarned   int64  `gorm:"column:total_earned"`
	}
	var topRows []topRow
	db.Raw(`
		SELECT r.referrer_id AS user_id, u.email, u.nickname,
			COUNT(r.id) AS referral_count,
			COALESCE((
				SELECT SUM(t.amount) FROM bff_schema.transactions t
				WHERE t.user_id = r.referrer_id AND t.type = ? AND t.amount > 0
			), 0) AS total_earned
		FROM bff_schema.referrals r
		JOIN bff_schema.users u ON u.id = r.referrer_id
		GROUP BY r.referrer_id, u.email, u.nickname
		ORDER BY referral_count DESC
		LIMIT 10
	`, model.TxTypeReferral).Scan(&topRows)

	topReferrers := make([]dto.AdminTopReferrerItem, len(topRows))
	for i, r := range topRows {
		topReferrers[i] = dto.AdminTopReferrerItem{
			UserID:        r.UserID,
			Email:         r.Email,
			Nickname:      r.Nickname,
			ReferralCount: r.ReferralCount,
			TotalEarned:   r.TotalEarned,
		}
	}

	return &dto.AdminReferralStatsResponse{
		TotalReferrals:     totalReferrals,
		TotalRewardsPoints: totalRewardsPoints,
		TodayReferrals:     todayReferrals,
		TodayRewardsPoints: todayRewardsPoints,
		ActiveReferralRate: activeReferralRate,
		TopReferrers:       topReferrers,
	}, nil
}

// ListReferrals 邀请关系列表
func (s *AdminReferralService) ListReferrals(req *dto.AdminReferralListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Table("bff_schema.referrals r").
		Joins("JOIN bff_schema.users referrer ON referrer.id = r.referrer_id").
		Joins("JOIN bff_schema.users referee ON referee.id = r.referee_id").
		Joins("LEFT JOIN bff_schema.user_balance ub ON ub.user_id = r.referee_id")

	if req.ReferrerEmail != "" {
		query = query.Where("referrer.email ILIKE ?", "%"+req.ReferrerEmail+"%")
	}
	if req.RefereeEmail != "" {
		query = query.Where("referee.email ILIKE ?", "%"+req.RefereeEmail+"%")
	}
	if req.StartDate != "" {
		query = query.Where("r.created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("r.created_at < ?", req.EndDate+" 23:59:59")
	}

	var total int64
	query.Count(&total)

	type referralRow struct {
		ID                   uint   `gorm:"column:id"`
		ReferrerID           uint   `gorm:"column:referrer_id"`
		ReferrerEmail        string `gorm:"column:referrer_email"`
		ReferrerNickname     string `gorm:"column:referrer_nickname"`
		RefereeID            uint   `gorm:"column:referee_id"`
		RefereeEmail         string `gorm:"column:referee_email"`
		RefereeNickname      string `gorm:"column:referee_nickname"`
		RefereeStatus        int8   `gorm:"column:referee_status"`
		RefereeTotalConsumed int64  `gorm:"column:referee_total_consumed"`
		CreatedAt            string `gorm:"column:created_at"`
	}
	var rows []referralRow

	err := query.
		Select(`r.id, r.referrer_id, referrer.email AS referrer_email, referrer.nickname AS referrer_nickname,
			r.referee_id, referee.email AS referee_email, referee.nickname AS referee_nickname,
			referee.status AS referee_status, COALESCE(ub.total_consumed, 0) AS referee_total_consumed,
			TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at`).
		Order("r.created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	// 查询每个邀请关系的奖励
	items := make([]dto.AdminReferralListItem, len(rows))
	for i, r := range rows {
		signupReward, rechargeReward := s.getReferralRewards(r.ReferrerID, r.RefereeID)
		items[i] = dto.AdminReferralListItem{
			ID:                   r.ID,
			ReferrerID:           r.ReferrerID,
			ReferrerEmail:        r.ReferrerEmail,
			ReferrerNickname:     r.ReferrerNickname,
			RefereeID:            r.RefereeID,
			RefereeEmail:         r.RefereeEmail,
			RefereeNickname:      r.RefereeNickname,
			RefereeStatus:        r.RefereeStatus,
			RefereeTotalConsumed: r.RefereeTotalConsumed,
			SignupReward:         signupReward,
			FirstRechargeReward:  rechargeReward,
			TotalReward:          signupReward + rechargeReward,
			CreatedAt:            r.CreatedAt,
		}
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetReferrerDetail 邀请人详情
func (s *AdminReferralService) GetReferrerDetail(userID uint, req *dto.AdminReferrerDetailRequest) (*dto.AdminReferrerDetailResponse, error) {
	db := database.GetDB()

	// 邀请人基本信息
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, ErrUserNotFound
	}

	// 统计
	var totalReferrals int64
	db.Model(&model.Referral{}).Where("referrer_id = ?", userID).Count(&totalReferrals)

	var totalEarned int64
	db.Model(&model.Transaction{}).
		Where("user_id = ? AND type = ? AND amount > 0", userID, model.TxTypeReferral).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalEarned)

	// 按描述区分注册奖励和首充返利
	var signupTotal int64
	db.Model(&model.Transaction{}).
		Where("user_id = ? AND type = ? AND amount > 0 AND description LIKE ?",
			userID, model.TxTypeReferral, "%邀请新用户%").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&signupTotal)

	rechargeTotal := totalEarned - signupTotal

	referrerInfo := dto.AdminReferrerInfo{
		UserID:               userID,
		Email:                user.Email,
		Nickname:             user.Nickname,
		InviteCode:           user.InviteCode,
		TotalReferrals:       totalReferrals,
		TotalEarned:          totalEarned,
		SignupRewardsTotal:   signupTotal,
		RechargeRewardsTotal: rechargeTotal,
	}

	// 被邀请人列表（分页）
	var refereeIDs []uint
	offset := req.GetOffset()
	limit := req.GetPageSize()

	db.Model(&model.Referral{}).
		Where("referrer_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Pluck("referee_id", &refereeIDs)

	referees := make([]dto.AdminRefereeItem, 0, len(refereeIDs))
	for _, refID := range refereeIDs {
		var referee model.User
		if err := db.First(&referee, refID).Error; err != nil {
			continue
		}

		var balance model.UserBalance
		db.Where("user_id = ?", refID).First(&balance)

		signupReward, rechargeReward := s.getReferralRewards(userID, refID)

		// 获取相关交易
		var txns []model.Transaction
		db.Where("user_id = ? AND type = ? AND description LIKE ?",
			userID, model.TxTypeReferral, "%"+referee.Email+"%").
			Order("created_at DESC").
			Limit(10).
			Find(&txns)

		// 如果按邮箱没找到，尝试按 reference_id 查找
		if len(txns) == 0 {
			db.Where("user_id = ? AND type = ? AND reference_id LIKE ?",
				userID, model.TxTypeReferral, "%"+fmt.Sprintf("%d", refID)+"%").
				Order("created_at DESC").
				Limit(10).
				Find(&txns)
		}

		rewardTxns := make([]dto.AdminReferralTransaction, len(txns))
		for j, t := range txns {
			rewardTxns[j] = dto.AdminReferralTransaction{
				ID:          t.ID,
				Type:        t.Type,
				Amount:      t.Amount,
				Description: t.Description,
				CreatedAt:   t.CreatedAt.Format("2006-01-02 15:04:05"),
			}
		}

		referees = append(referees, dto.AdminRefereeItem{
			RefereeID:           refID,
			Email:               referee.Email,
			Status:              referee.Status,
			RegisteredAt:        referee.CreatedAt.Format("2006-01-02 15:04:05"),
			TotalConsumed:       balance.TotalConsumed,
			TotalRecharged:      balance.TotalRecharged,
			SignupReward:        signupReward,
			FirstRechargeReward: rechargeReward,
			RewardTransactions:  rewardTxns,
		})
	}

	return &dto.AdminReferrerDetailResponse{
		Referrer:      referrerInfo,
		Referees:      referees,
		TotalReferees: totalReferrals,
		Page:          req.GetPage(),
		PageSize:      req.GetPageSize(),
	}, nil
}

// getReferralRewards 获取指定邀请关系的奖励金额
func (s *AdminReferralService) getReferralRewards(referrerID, refereeID uint) (signupReward, rechargeReward int64) {
	db := database.GetDB()

	// 通过交易中的描述或 reference 判断
	var txns []model.Transaction
	db.Where("user_id = ? AND type = ? AND amount > 0",
		referrerID, model.TxTypeReferral).
		Find(&txns)

	refereeIDStr := fmt.Sprintf("%d", refereeID)
	for _, t := range txns {
		// 匹配该被邀请人相关的交易
		if containsRef(t.ReferenceID, refereeIDStr) || containsRef(t.Description, refereeIDStr) {
			if containsRef(t.Description, "邀请新用户") || containsRef(t.Description, "注册") {
				signupReward += t.Amount
			} else {
				rechargeReward += t.Amount
			}
		}
	}
	return
}

func containsRef(s, sub string) bool {
	return len(s) > 0 && len(sub) > 0 && contains(s, sub)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
