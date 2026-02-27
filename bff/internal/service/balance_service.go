package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
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

// GetBalance 获取账户余额信息
func (s *BalanceService) GetBalance(userID uint) (*dto.BalanceResponse, error) {
	db := database.GetDB()

	var balance model.UserBalance
	err := db.Where("user_id = ?", userID).First(&balance).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
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

// initBalance 兜底：如果余额记录不存在则自动创建
func (s *BalanceService) initBalance(db *gorm.DB, userID uint) (*dto.BalanceResponse, error) {
	balance := &model.UserBalance{
		UserID:  userID,
		Balance: 0,
	}
	if err := db.Create(balance).Error; err != nil {
		return nil, err
	}
	return &dto.BalanceResponse{}, nil
}

// CheckBalance 余额检查（对话前调用）
func (s *BalanceService) CheckBalance(userID uint, modelName string) (*dto.BalanceCheckResponse, error) {
	db := database.GetDB()

	var balance model.UserBalance
	if err := db.Where("user_id = ?", userID).First(&balance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &dto.BalanceCheckResponse{
				Sufficient:    false,
				Balance:       0,
				EstimatedCost: s.estimateMinCost(modelName),
			}, nil
		}
		return nil, err
	}

	estimatedCost := s.estimateMinCost(modelName)

	return &dto.BalanceCheckResponse{
		Sufficient:    balance.Balance >= estimatedCost,
		Balance:       balance.Balance,
		EstimatedCost: estimatedCost,
	}, nil
}

// estimateMinCost 预估最低消耗
func (s *BalanceService) estimateMinCost(modelName string) int64 {
	for _, m := range s.cfg.Models {
		if m.Name == modelName {
			// 预估最少 500 input + 200 output tokens
			return int64(m.InputPrice)*500/1000 + int64(m.OutputPrice)*200/1000
		}
	}
	return 1
}

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
			Amount:        -points,
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
			Amount:        points,
			BalanceAfter:  newBalance,
			Description:   desc,
			ReferenceID:   refID,
			ReferenceType: refType,
			Metadata:      metaJSON,
		}
		return tx.Create(txRecord).Error
	})
}

// GetTransactions 获取交易记录列表
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

// InitBalanceForNewUser 在注册事务中调用，创建余额记录并赠送初始点数
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

// grantRechargeReferralBonus 充值返利：每次充值都给推荐人发放返利（同步调用）
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

// checkLowBalance 在扣费后检查余额，触发系统消息
func (s *BalanceService) checkLowBalance(tx *gorm.DB, userID uint, balance int64) {
	if balance > s.cfg.LowBalanceThreshold {
		return
	}

	// 检查今日是否已发过预警消息
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	tx.Model(&model.SystemMessage{}).
		Where("user_id = ? AND msg_type = ? AND created_at >= ?",
			userID, "usage", today).
		Count(&count)
	if count > 0 {
		return
	}

	msg := &model.SystemMessage{
		UserID: userID,
		Title:  "余额不足提醒",
		Content: fmt.Sprintf(
			"您的账户余额已不足 %d 点，为避免创作中断，建议尽快充值。\n当前余额：%d 点",
			s.cfg.LowBalanceThreshold, balance),
		MsgType: "usage",
		IsRead:  false,
	}
	tx.Create(msg)
}
