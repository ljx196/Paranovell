package service

import (
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

type AdminOrderService struct{}

func NewAdminOrderService() *AdminOrderService {
	return &AdminOrderService{}
}

// ListOrders 订单列表
func (s *AdminOrderService) ListOrders(req *dto.AdminOrderListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Table("bff_schema.recharge_orders")

	if req.Status != nil {
		query = query.Where("bff_schema.recharge_orders.status = ?", *req.Status)
	}
	if req.PaymentMethod != "" {
		query = query.Where("bff_schema.recharge_orders.payment_method = ?", req.PaymentMethod)
	}
	if req.UserEmail != "" {
		keyword := "%" + req.UserEmail + "%"
		query = query.Joins("JOIN bff_schema.users u ON u.id = bff_schema.recharge_orders.user_id").
			Where("u.email ILIKE ?", keyword)
	}
	if req.StartDate != "" {
		query = query.Where("bff_schema.recharge_orders.created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("bff_schema.recharge_orders.created_at < ?", req.EndDate+" 23:59:59")
	}

	var total int64
	query.Count(&total)

	type orderRow struct {
		ID            uint    `gorm:"column:id"`
		OrderNo       string  `gorm:"column:order_no"`
		UserID        uint    `gorm:"column:user_id"`
		UserEmail     string  `gorm:"column:user_email"`
		AmountYuan    float64 `gorm:"column:amount_yuan"`
		Points        int64   `gorm:"column:points"`
		PaymentMethod string  `gorm:"column:payment_method"`
		Status        int8    `gorm:"column:status"`
		CreatedAt     string  `gorm:"column:created_at"`
		PaidAt        *string `gorm:"column:paid_at"`
	}
	var rows []orderRow

	selectSQL := "bff_schema.recharge_orders.id, bff_schema.recharge_orders.order_no, bff_schema.recharge_orders.user_id, u.email as user_email, bff_schema.recharge_orders.amount_yuan, bff_schema.recharge_orders.points, bff_schema.recharge_orders.payment_method, bff_schema.recharge_orders.status, TO_CHAR(bff_schema.recharge_orders.created_at, 'YYYY-MM-DD HH24:MI') as created_at, TO_CHAR(bff_schema.recharge_orders.paid_at, 'YYYY-MM-DD HH24:MI') as paid_at"

	// Ensure join exists for email
	joinQuery := query
	if req.UserEmail == "" {
		joinQuery = joinQuery.Joins("JOIN bff_schema.users u ON u.id = bff_schema.recharge_orders.user_id")
	}

	err := joinQuery.
		Select(selectSQL).
		Order("bff_schema.recharge_orders.created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.AdminOrderListItem, len(rows))
	for i, o := range rows {
		item := dto.AdminOrderListItem{
			ID:            o.ID,
			OrderNo:       o.OrderNo,
			UserID:        o.UserID,
			UserEmail:     o.UserEmail,
			AmountYuan:    o.AmountYuan,
			Points:        o.Points,
			PaymentMethod: o.PaymentMethod,
			Status:        o.Status,
			CreatedAt:     o.CreatedAt,
		}
		if o.PaidAt != nil {
			item.PaidAt = *o.PaidAt
		}
		items[i] = item
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetOrderSummary 订单统计概要
func (s *AdminOrderService) GetOrderSummary(req *dto.AdminOrderListRequest) (*dto.AdminOrderSummaryResponse, error) {
	db := database.GetDB()

	type summaryRow struct {
		Status int8    `gorm:"column:status"`
		Total  int64   `gorm:"column:total"`
		Amount float64 `gorm:"column:amount"`
	}
	var rows []summaryRow

	query := db.Model(&model.RechargeOrder{}).
		Select("status, COUNT(*) as total, COALESCE(SUM(amount_yuan), 0) as amount").
		Group("status")

	if req.StartDate != "" {
		query = query.Where("created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
	}

	if err := query.Scan(&rows).Error; err != nil {
		return nil, err
	}

	resp := &dto.AdminOrderSummaryResponse{}
	for _, r := range rows {
		resp.TotalCount += r.Total
		switch r.Status {
		case model.OrderStatusPaid:
			resp.PaidAmount = r.Amount
		case model.OrderStatusPending:
			resp.PendingAmount = r.Amount
		case model.OrderStatusCancelled:
			resp.CancelledAmount = r.Amount
		case model.OrderStatusRefunded:
			resp.RefundedAmount = r.Amount
		}
	}

	return resp, nil
}

// ListTransactions 管理端交易流水列表
func (s *AdminOrderService) ListTransactions(req *dto.AdminTransactionListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Table("bff_schema.transactions")

	if req.Type != "" {
		query = query.Where("bff_schema.transactions.type = ?", req.Type)
	}
	if req.UserEmail != "" {
		keyword := "%" + req.UserEmail + "%"
		query = query.Joins("JOIN bff_schema.users u ON u.id = bff_schema.transactions.user_id").
			Where("u.email ILIKE ?", keyword)
	}
	if req.StartDate != "" {
		query = query.Where("bff_schema.transactions.created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("bff_schema.transactions.created_at < ?", req.EndDate+" 23:59:59")
	}

	var total int64
	query.Count(&total)

	type txRow struct {
		ID           uint   `gorm:"column:id"`
		UserID       uint   `gorm:"column:user_id"`
		UserEmail    string `gorm:"column:user_email"`
		Type         string `gorm:"column:type"`
		Amount       int64  `gorm:"column:amount"`
		BalanceAfter int64  `gorm:"column:balance_after"`
		Description  string `gorm:"column:description"`
		CreatedAt    string `gorm:"column:created_at"`
	}
	var rows []txRow

	joinQuery := query
	if req.UserEmail == "" {
		joinQuery = joinQuery.Joins("JOIN bff_schema.users u ON u.id = bff_schema.transactions.user_id")
	}

	err := joinQuery.
		Select("bff_schema.transactions.id, bff_schema.transactions.user_id, u.email as user_email, bff_schema.transactions.type, bff_schema.transactions.amount, bff_schema.transactions.balance_after, bff_schema.transactions.description, TO_CHAR(bff_schema.transactions.created_at, 'YYYY-MM-DD HH24:MI') as created_at").
		Order("bff_schema.transactions.created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.AdminTransactionItem, len(rows))
	for i, t := range rows {
		items[i] = dto.AdminTransactionItem{
			ID:           t.ID,
			UserID:       t.UserID,
			UserEmail:    t.UserEmail,
			Type:         t.Type,
			Amount:       t.Amount,
			BalanceAfter: t.BalanceAfter,
			Description:  t.Description,
			CreatedAt:    t.CreatedAt,
		}
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}
