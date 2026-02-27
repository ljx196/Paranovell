package service

import (
	"fmt"
	"math/rand"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"github.com/gennovelweb/bff/internal/utils"
)

type AdminUserService struct {
	balanceService *BalanceService
	auditService   *AdminAuditService
}

func NewAdminUserService(bs *BalanceService, as *AdminAuditService) *AdminUserService {
	return &AdminUserService{balanceService: bs, auditService: as}
}

// List 用户列表（支持搜索/筛选/分页）
func (s *AdminUserService) List(req *dto.AdminUserListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Table("bff_schema.users").Where("bff_schema.users.deleted_at IS NULL")

	if req.Keyword != "" {
		keyword := "%" + req.Keyword + "%"
		query = query.Where("bff_schema.users.email ILIKE ? OR bff_schema.users.nickname ILIKE ?", keyword, keyword)
	}
	if req.Status != nil {
		query = query.Where("bff_schema.users.status = ?", *req.Status)
	}
	if req.StartDate != "" {
		query = query.Where("bff_schema.users.created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("bff_schema.users.created_at < ?", req.EndDate+" 23:59:59")
	}

	var total int64
	query.Count(&total)

	type userRow struct {
		ID        uint   `gorm:"column:id"`
		Email     string `gorm:"column:email"`
		Nickname  string `gorm:"column:nickname"`
		AvatarURL string `gorm:"column:avatar_url"`
		Status    int8   `gorm:"column:status"`
		Role      string `gorm:"column:role"`
		CreatedAt string `gorm:"column:created_at"`
		Balance   int64  `gorm:"column:balance"`
	}
	var rows []userRow

	err := query.
		Select("bff_schema.users.id, bff_schema.users.email, bff_schema.users.nickname, bff_schema.users.avatar_url, bff_schema.users.status, bff_schema.users.role, TO_CHAR(bff_schema.users.created_at, 'YYYY-MM-DD HH24:MI') as created_at, COALESCE(ub.balance, 0) as balance").
		Joins("LEFT JOIN bff_schema.user_balance ub ON ub.user_id = bff_schema.users.id").
		Order("bff_schema.users.created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.AdminUserListItem, len(rows))
	for i, u := range rows {
		items[i] = dto.AdminUserListItem{
			ID:        u.ID,
			Email:     u.Email,
			Nickname:  u.Nickname,
			AvatarURL: u.AvatarURL,
			Status:    u.Status,
			Role:      u.Role,
			Balance:   u.Balance,
			CreatedAt: u.CreatedAt,
		}
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetDetail 用户详情（基本信息 + 余额 + 最近交易）
func (s *AdminUserService) GetDetail(userID uint) (*dto.AdminUserDetailResponse, error) {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, ErrUserNotFound
	}

	var balance model.UserBalance
	if err := db.Where("user_id = ?", userID).First(&balance).Error; err != nil {
		// Balance record may not exist yet; use zero values
		balance = model.UserBalance{UserID: userID}
	}

	var txns []model.Transaction
	db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(5).
		Find(&txns)

	recentTxns := make([]dto.AdminTransactionItem, len(txns))
	for i, t := range txns {
		recentTxns[i] = dto.AdminTransactionItem{
			ID:           t.ID,
			UserID:       t.UserID,
			Type:         t.Type,
			Amount:       t.Amount,
			BalanceAfter: t.BalanceAfter,
			Description:  t.Description,
			CreatedAt:    t.CreatedAt.Format("2006-01-02 15:04"),
		}
	}

	resp := &dto.AdminUserDetailResponse{
		ID:            user.ID,
		Email:         user.Email,
		Nickname:      user.Nickname,
		AvatarURL:     user.AvatarURL,
		Status:        user.Status,
		Role:          user.Role,
		InviteCode:    user.InviteCode,
		EmailVerified: user.EmailVerified,
		CreatedAt:     user.CreatedAt.Format("2006-01-02 15:04:05"),
		RecentTransactions: recentTxns,
	}
	resp.Balance.Balance = balance.Balance
	resp.Balance.TotalRecharged = balance.TotalRecharged
	resp.Balance.TotalConsumed = balance.TotalConsumed
	resp.Balance.TotalGifted = balance.TotalGifted

	return resp, nil
}

// UpdateStatus 封禁/解封用户
func (s *AdminUserService) UpdateStatus(adminID uint, userID uint,
	req *dto.UpdateUserStatusRequest, ip string) error {

	db := database.GetDB()

	result := db.Model(&model.User{}).
		Where("id = ? AND deleted_at IS NULL", userID).
		Update("status", req.Status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}

	action := model.AuditUserDisable
	if req.Status == 1 {
		action = model.AuditUserEnable
	}
	s.auditService.Record(adminID, action,
		model.TargetTypeUser, fmt.Sprintf("%d", userID),
		map[string]interface{}{
			"status": req.Status,
			"reason": req.Reason,
		}, ip)

	return nil
}

// AdjustBalance 手动调账
func (s *AdminUserService) AdjustBalance(adminID uint, userID uint,
	req *dto.AdjustBalanceRequest, ip string) error {

	balResp, err := s.balanceService.GetBalance(userID)
	if err != nil {
		return err
	}

	if req.Type == "increase" {
		desc := fmt.Sprintf("管理员调账(增加): %s", req.Reason)
		err = s.balanceService.Credit(userID, req.Amount, model.TxTypeGift,
			desc, fmt.Sprintf("admin:%d", adminID), "admin_adjust", nil)
	} else {
		if balResp.Balance < req.Amount {
			return ErrInsufficientBalance
		}
		desc := fmt.Sprintf("管理员调账(扣除): %s", req.Reason)
		err = s.balanceService.Deduct(userID, req.Amount,
			desc, fmt.Sprintf("admin:%d", adminID), "admin_adjust", nil)
	}
	if err != nil {
		return err
	}

	newBalance := balResp.Balance + req.Amount
	if req.Type == "decrease" {
		newBalance = balResp.Balance - req.Amount
	}

	s.auditService.Record(adminID, model.AuditUserAdjustBal,
		model.TargetTypeUser, fmt.Sprintf("%d", userID),
		map[string]interface{}{
			"type":           req.Type,
			"amount":         req.Amount,
			"reason":         req.Reason,
			"balance_before": balResp.Balance,
			"balance_after":  newBalance,
		}, ip)

	return nil
}

// ResetPassword 重置密码
func (s *AdminUserService) ResetPassword(adminID uint, userID uint,
	sendEmail bool, ip string) (string, error) {

	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		return "", ErrUserNotFound
	}

	// 生成随机密码
	newPassword := generateRandomPassword(12)
	hashedPwd, err := utils.HashPassword(newPassword)
	if err != nil {
		return "", err
	}

	if err := db.Model(&user).Update("password_hash", hashedPwd).Error; err != nil {
		return "", err
	}

	// 审计日志
	s.auditService.Record(adminID, model.AuditUserResetPwd,
		model.TargetTypeUser, fmt.Sprintf("%d", userID),
		map[string]interface{}{
			"user_email": user.Email,
			"send_email": sendEmail,
		}, ip)

	return newPassword, nil
}

// generateRandomPassword 生成随机密码
func generateRandomPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
