package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrOrderNotFound    = errors.New("order not found")
	ErrOrderAlreadyPaid = errors.New("order already paid")
	ErrInvalidAmount    = errors.New("invalid recharge amount")
	ErrInvalidSign      = errors.New("invalid payment signature")
)

type RechargeService struct {
	cfg            *config.BalanceConfig
	balanceService *BalanceService
}

func NewRechargeService(cfg *config.BalanceConfig, bs *BalanceService) *RechargeService {
	return &RechargeService{cfg: cfg, balanceService: bs}
}

// GetConfig 获取充值配置
func (s *RechargeService) GetConfig() *dto.RechargeConfigResponse {
	presets := make([]dto.RechargePresetDTO, len(s.cfg.RechargePresets))
	for i, p := range s.cfg.RechargePresets {
		presets[i] = dto.RechargePresetDTO{
			AmountYuan: p.AmountYuan,
			Points:     p.Points,
		}
	}

	return &dto.RechargeConfigResponse{
		ExchangeRate:   s.cfg.ExchangeRate,
		MinAmountYuan:  s.cfg.MinRechargeYuan,
		Presets:        presets,
		PaymentMethods: s.cfg.PaymentMethods,
	}
}

// CreateOrder 创建充值订单
func (s *RechargeService) CreateOrder(userID uint, req *dto.CreateRechargeRequest) (*dto.CreateRechargeResponse, error) {
	if req.AmountYuan < s.cfg.MinRechargeYuan {
		return nil, ErrInvalidAmount
	}

	points := int64(req.AmountYuan * float64(s.cfg.ExchangeRate))
	orderNo := generateOrderNo(userID)

	order := &model.RechargeOrder{
		UserID:        userID,
		OrderNo:       orderNo,
		AmountYuan:    req.AmountYuan,
		Points:        points,
		PaymentMethod: req.PaymentMethod,
		Status:        model.OrderStatusPending,
	}

	db := database.GetDB()
	if err := db.Create(order).Error; err != nil {
		return nil, fmt.Errorf("创建订单失败: %w", err)
	}

	paymentURL := s.createPayment(order)

	expireAt := order.CreatedAt.Add(
		time.Duration(s.cfg.OrderTimeoutMinutes) * time.Minute)

	return &dto.CreateRechargeResponse{
		OrderNo:       order.OrderNo,
		AmountYuan:    order.AmountYuan,
		Points:        order.Points,
		PaymentMethod: order.PaymentMethod,
		PaymentURL:    paymentURL,
		ExpireAt:      expireAt.Format(time.RFC3339),
	}, nil
}

// HandleCallback 支付平台回调，幂等处理
// 幂等性由 UPDATE WHERE status=0 原子操作保证
func (s *RechargeService) HandleCallback(req *dto.PaymentCallbackRequest) error {
	if !s.verifySign(req) {
		return ErrInvalidSign
	}

	db := database.GetDB()

	var paidOrder *model.RechargeOrder

	err := db.Transaction(func(tx *gorm.DB) error {
		// 原子更新订单状态：UPDATE WHERE status=0
		now := time.Now()
		result := tx.Model(&model.RechargeOrder{}).
			Where("order_no = ? AND status = ?", req.OrderNo, model.OrderStatusPending).
			Updates(map[string]interface{}{
				"status":     model.OrderStatusPaid,
				"paid_at":    now,
				"updated_at": now,
			})
		if result.Error != nil {
			return fmt.Errorf("更新订单失败: %w", result.Error)
		}

		// rows_affected=0 说明订单不存在或已处理
		if result.RowsAffected == 0 {
			var order model.RechargeOrder
			if err := tx.Where("order_no = ?", req.OrderNo).First(&order).Error; err != nil {
				return ErrOrderNotFound
			}
			return nil // 订单已处理，幂等返回成功
		}

		// 查询订单详情用于入账
		var order model.RechargeOrder
		if err := tx.Where("order_no = ?", req.OrderNo).First(&order).Error; err != nil {
			return err
		}

		// 金额校验
		if req.AmountYuan != order.AmountYuan {
			return ErrInvalidAmount
		}

		// 入账
		if err := s.creditWithTx(tx, order); err != nil {
			return err
		}

		paidOrder = &order
		return nil
	})

	if err != nil {
		return err
	}

	// 事务成功后，同步执行充值返利（独立事务，失败仅记日志不影响充值）
	if paidOrder != nil {
		s.balanceService.grantRechargeReferralBonus(paidOrder.UserID, paidOrder.Points, paidOrder.OrderNo)
	}

	return nil
}

// creditWithTx 在事务内完成入账
func (s *RechargeService) creditWithTx(tx *gorm.DB, order model.RechargeOrder) error {
	var balance model.UserBalance
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("user_id = ?", order.UserID).
		First(&balance).Error
	if err != nil {
		return err
	}

	newBalance := balance.Balance + order.Points
	err = tx.Model(&balance).Updates(map[string]interface{}{
		"balance":         newBalance,
		"total_recharged": gorm.Expr("total_recharged + ?", order.Points),
		"updated_at":      time.Now(),
	}).Error
	if err != nil {
		return err
	}

	metadata, _ := json.Marshal(map[string]interface{}{
		"payment_method": order.PaymentMethod,
		"amount_yuan":    fmt.Sprintf("%.2f", order.AmountYuan),
		"order_no":       order.OrderNo,
	})

	txRecord := &model.Transaction{
		UserID:        order.UserID,
		Type:          model.TxTypeRecharge,
		Amount:        order.Points,
		BalanceAfter:  newBalance,
		Description:   fmt.Sprintf("充值 %.2f 元", order.AmountYuan),
		ReferenceID:   order.OrderNo,
		ReferenceType: "order",
		Metadata:      metadata,
	}
	return tx.Create(txRecord).Error
}

// GetOrderStatus 查询订单状态
func (s *RechargeService) GetOrderStatus(userID uint, orderNo string) (*dto.OrderStatusResponse, error) {
	db := database.GetDB()

	var order model.RechargeOrder
	err := db.Where("order_no = ? AND user_id = ?", orderNo, userID).
		First(&order).Error
	if err != nil {
		return nil, ErrOrderNotFound
	}

	statusText := map[int8]string{
		0: "待支付", 1: "已支付", 2: "已取消", 3: "已退款",
	}

	return &dto.OrderStatusResponse{
		OrderNo:    order.OrderNo,
		Status:     order.Status,
		StatusText: statusText[order.Status],
		Points:     order.Points,
		PaidAt:     order.PaidAt,
	}, nil
}

// CancelExpiredOrders 定时任务调用，取消超时未支付订单
func (s *RechargeService) CancelExpiredOrders() (int64, error) {
	db := database.GetDB()

	expireTime := time.Now().Add(
		-time.Duration(s.cfg.OrderTimeoutMinutes) * time.Minute)

	result := db.Model(&model.RechargeOrder{}).
		Where("status = ? AND created_at < ?",
			model.OrderStatusPending, expireTime).
		Update("status", model.OrderStatusCancelled)

	return result.RowsAffected, result.Error
}

// generateOrderNo 生成唯一订单号
func generateOrderNo(userID uint) string {
	now := time.Now()
	userSuffix := fmt.Sprintf("%04d", userID%10000)
	random := fmt.Sprintf("%04d", rand.Intn(10000))
	return fmt.Sprintf("R%s%s%s",
		now.Format("20060102150405"), userSuffix, random)
}

// createPayment 调用支付平台（预留，返回模拟 URL）
func (s *RechargeService) createPayment(order *model.RechargeOrder) string {
	// TODO: 对接支付宝/微信支付 SDK
	return fmt.Sprintf("/pay/mock?order_no=%s", order.OrderNo)
}

// verifySign 验签（预留）
func (s *RechargeService) verifySign(req *dto.PaymentCallbackRequest) bool {
	// TODO: 根据支付平台规则实现验签
	return req.Sign != ""
}
