package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gennovelweb/bff/internal/client"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
)

var (
	ErrReviewNotFound      = errors.New("review record not found")
	ErrConversationDeleted = errors.New("conversation already deleted")
)

// AdminContentService 内容审查服务
type AdminContentService struct {
	algorithmClient client.AlgorithmClientInterface
	auditService    *AdminAuditService
	userService     *AdminUserService
}

// NewAdminContentService 创建内容审查服务
func NewAdminContentService(algClient client.AlgorithmClientInterface, auditSvc *AdminAuditService, userSvc *AdminUserService) *AdminContentService {
	return &AdminContentService{
		algorithmClient: algClient,
		auditService:    auditSvc,
		userService:     userSvc,
	}
}

// ListConversations 获取对话列表（需指定用户或筛选条件）
func (s *AdminContentService) ListConversations(req *dto.AdminConversationListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	// 如果仅显示已标记，查询审查记录
	if req.OnlyFlagged != nil && *req.OnlyFlagged {
		return s.listFlaggedConversations(req)
	}

	// 需要 user_id 或 user_email 来查询对话
	var userID uint
	if req.UserID != nil {
		userID = *req.UserID
	} else if req.UserEmail != "" {
		var user model.User
		if err := db.Where("email ILIKE ? AND deleted_at IS NULL", "%"+req.UserEmail+"%").First(&user).Error; err != nil {
			return &dto.PaginatedResult{Total: 0, Items: []dto.AdminConversationListItem{}}, nil
		}
		userID = user.ID
	}

	if userID == 0 {
		// 没有指定用户则返回已标记的对话
		return s.listFlaggedConversations(req)
	}

	// 从算法后端获取对话列表
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := s.algorithmClient.ListConversations(ctx, userID, req.GetPage(), req.GetPageSize())
	if err != nil {
		return nil, fmt.Errorf("获取对话列表失败: %w", err)
	}
	if result == nil || result.Conversations == nil {
		return &dto.PaginatedResult{Items: []dto.AdminConversationListItem{}, Total: 0}, nil
	}

	// 查询用户信息
	var user model.User
	db.Select("id, email, nickname").First(&user, userID)

	// 批量查询审查记录
	convIDs := make([]string, len(result.Conversations))
	for i, c := range result.Conversations {
		convIDs[i] = c.ID
	}
	reviewMap := s.getReviewsMap(convIDs)

	items := make([]dto.AdminConversationListItem, len(result.Conversations))
	for i, c := range result.Conversations {
		item := dto.AdminConversationListItem{
			ConversationID: c.ID,
			Title:          c.Title,
			UserID:         userID,
			UserEmail:      user.Email,
			UserNickname:   user.Nickname,
			Model:          c.Model,
			MessageCount:   c.MessageCount,
			CreatedAt:      c.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:      c.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
		if review, ok := reviewMap[c.ID]; ok {
			item.Review = &dto.AdminConversationReviewVO{
				ID:         review.ID,
				Status:     review.Status,
				FlagType:   review.FlagType,
				FlagReason: review.FlagReason,
				CreatedAt:  review.CreatedAt.Format("2006-01-02 15:04:05"),
			}
		}

		// 按审查状态筛选
		if req.ReviewStatus != "" {
			if item.Review == nil || item.Review.Status != req.ReviewStatus {
				continue
			}
		}

		items = append(items[:0+i], item)
	}

	// 重建无跳过的切片
	filtered := make([]dto.AdminConversationListItem, 0, len(items))
	for _, item := range items {
		if item.ConversationID != "" {
			if req.ReviewStatus != "" {
				if item.Review != nil && item.Review.Status == req.ReviewStatus {
					filtered = append(filtered, item)
				}
			} else {
				filtered = append(filtered, item)
			}
		}
	}

	return &dto.PaginatedResult{Total: result.Total, Items: filtered}, nil
}

// listFlaggedConversations 仅列出已标记的对话
func (s *AdminContentService) listFlaggedConversations(req *dto.AdminConversationListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Model(&model.ContentReview{})

	if req.ReviewStatus != "" {
		query = query.Where("status = ?", req.ReviewStatus)
	}
	if req.UserID != nil {
		query = query.Where("user_id = ?", *req.UserID)
	}
	if req.UserEmail != "" {
		subQuery := db.Model(&model.User{}).
			Select("id").
			Where("email ILIKE ? AND deleted_at IS NULL", "%"+req.UserEmail+"%")
		query = query.Where("user_id IN (?)", subQuery)
	}

	var total int64
	query.Count(&total)

	var reviews []model.ContentReview
	if err := query.Order("created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Find(&reviews).Error; err != nil {
		return nil, err
	}

	// 批量查询用户信息
	userIDs := make([]uint, 0)
	for _, r := range reviews {
		userIDs = append(userIDs, r.UserID)
	}
	userMap := s.getUserMap(userIDs)

	items := make([]dto.AdminConversationListItem, len(reviews))
	for i, r := range reviews {
		userInfo := userMap[r.UserID]
		items[i] = dto.AdminConversationListItem{
			ConversationID: r.ConversationID,
			UserID:         r.UserID,
			UserEmail:      userInfo.Email,
			UserNickname:   userInfo.Nickname,
			CreatedAt:      r.CreatedAt.Format("2006-01-02 15:04:05"),
			Review: &dto.AdminConversationReviewVO{
				ID:         r.ID,
				Status:     r.Status,
				FlagType:   r.FlagType,
				FlagReason: r.FlagReason,
				CreatedAt:  r.CreatedAt.Format("2006-01-02 15:04:05"),
			},
		}
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// GetMessages 获取对话消息
func (s *AdminContentService) GetMessages(conversationID string, req *dto.AdminConversationMessagesRequest) (*dto.PaginatedResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	result, err := s.algorithmClient.GetMessages(ctx, req.UserID, conversationID, req.GetPage(), req.GetPageSize())
	if err != nil {
		return nil, fmt.Errorf("获取消息失败: %w", err)
	}

	items := make([]dto.AdminMessageItem, len(result.Messages))
	for i, m := range result.Messages {
		items[i] = dto.AdminMessageItem{
			ID:        m.ID,
			Role:      m.Role,
			Content:   m.Content,
			CreatedAt: m.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return &dto.PaginatedResult{Total: result.Total, Items: items}, nil
}

// FlagConversation 手动标记对话
func (s *AdminContentService) FlagConversation(adminID uint, conversationID string, req *dto.AdminFlagRequest, ip string) (*model.ContentReview, error) {
	db := database.GetDB()

	// 检查是否已有审查记录
	var existing model.ContentReview
	err := db.Where("conversation_id = ?", conversationID).First(&existing).Error
	if err == nil {
		// 已存在，更新
		existing.FlagReason = req.Reason
		existing.FlagType = model.FlagTypeManual
		if existing.Status != model.ReviewStatusPending {
			existing.Status = model.ReviewStatusPending
		}
		db.Save(&existing)

		s.auditService.Record(adminID, model.AuditContentReview,
			model.TargetTypeConversation, conversationID,
			map[string]interface{}{"action": "flag", "reason": req.Reason, "user_id": req.UserID}, ip)

		return &existing, nil
	}

	// 新建审查记录
	review := &model.ContentReview{
		ConversationID: conversationID,
		UserID:         req.UserID,
		Status:         model.ReviewStatusPending,
		FlagType:       model.FlagTypeManual,
		FlagReason:     req.Reason,
	}
	if err := db.Create(review).Error; err != nil {
		return nil, err
	}

	s.auditService.Record(adminID, model.AuditContentReview,
		model.TargetTypeConversation, conversationID,
		map[string]interface{}{"action": "flag", "reason": req.Reason, "user_id": req.UserID}, ip)

	return review, nil
}

// ReviewConversation 提交审查
func (s *AdminContentService) ReviewConversation(adminID uint, conversationID string, req *dto.AdminReviewRequest, ip string) error {
	db := database.GetDB()

	var review model.ContentReview
	if err := db.Where("conversation_id = ?", conversationID).First(&review).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReviewNotFound
		}
		return err
	}

	now := time.Now()
	action := req.Action
	if action == "" {
		action = model.ActionNone
	}

	review.Status = req.Status
	review.ReviewerID = &adminID
	review.ReviewedAt = &now
	review.ActionTaken = action
	if req.Reason != "" {
		review.FlagReason = req.Reason
	}

	if err := db.Save(&review).Error; err != nil {
		return err
	}

	// 执行处理动作
	if req.Status == model.ReviewStatusViolated {
		switch action {
		case model.ActionDeleteConversation:
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			if err := s.algorithmClient.DeleteConversation(ctx, req.UserID, conversationID); err != nil {
				// 记录错误但不阻塞审查
				fmt.Printf("[AdminContentService] delete conversation %s failed: %v\n", conversationID, err)
			}
			s.auditService.Record(adminID, model.AuditContentDelete,
				model.TargetTypeConversation, conversationID,
				map[string]interface{}{"user_id": req.UserID, "reason": req.Reason}, ip)

		case model.ActionBanUser:
			banReq := &dto.UpdateUserStatusRequest{Status: 0, Reason: fmt.Sprintf("内容违规: %s", req.Reason)}
			if err := s.userService.UpdateStatus(adminID, req.UserID, banReq, ip); err != nil {
				fmt.Printf("[AdminContentService] ban user %d failed: %v\n", req.UserID, err)
			}
		}
	}

	s.auditService.Record(adminID, model.AuditContentReview,
		model.TargetTypeConversation, conversationID,
		map[string]interface{}{
			"status":  req.Status,
			"action":  action,
			"reason":  req.Reason,
			"user_id": req.UserID,
		}, ip)

	return nil
}

// ListReviews 审查记录列表
func (s *AdminContentService) ListReviews(req *dto.AdminReviewListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Model(&model.ContentReview{})

	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.FlagType != "" {
		query = query.Where("flag_type = ?", req.FlagType)
	}
	if req.UserID != nil {
		query = query.Where("user_id = ?", *req.UserID)
	}
	if req.StartDate != "" {
		query = query.Where("created_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("created_at < ?", req.EndDate+" 23:59:59")
	}

	var total int64
	query.Count(&total)

	var reviews []model.ContentReview
	if err := query.Order("created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Find(&reviews).Error; err != nil {
		return nil, err
	}

	// 批量查询用户 + 审查员邮箱
	userIDs := make([]uint, 0)
	reviewerIDs := make([]uint, 0)
	for _, r := range reviews {
		userIDs = append(userIDs, r.UserID)
		if r.ReviewerID != nil {
			reviewerIDs = append(reviewerIDs, *r.ReviewerID)
		}
	}
	userMap := s.getUserMap(userIDs)
	reviewerMap := s.getUserMap(reviewerIDs)

	items := make([]dto.AdminReviewListItem, len(reviews))
	for i, r := range reviews {
		item := dto.AdminReviewListItem{
			ID:             r.ID,
			ConversationID: r.ConversationID,
			UserID:         r.UserID,
			UserEmail:      userMap[r.UserID].Email,
			Status:         r.Status,
			FlagType:       r.FlagType,
			FlagReason:     r.FlagReason,
			ActionTaken:    r.ActionTaken,
			CreatedAt:      r.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if r.ReviewerID != nil {
			item.ReviewerEmail = reviewerMap[*r.ReviewerID].Email
		}
		if r.ReviewedAt != nil {
			item.ReviewedAt = r.ReviewedAt.Format("2006-01-02 15:04:05")
		}
		items[i] = item
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// getReviewsMap 批量查询审查记录
func (s *AdminContentService) getReviewsMap(convIDs []string) map[string]model.ContentReview {
	if len(convIDs) == 0 {
		return map[string]model.ContentReview{}
	}
	db := database.GetDB()
	var reviews []model.ContentReview
	db.Where("conversation_id IN ?", convIDs).Find(&reviews)

	m := make(map[string]model.ContentReview, len(reviews))
	for _, r := range reviews {
		m[r.ConversationID] = r
	}
	return m
}

type userInfo struct {
	ID       uint
	Email    string
	Nickname string
}

// getUserMap 批量查询用户基本信息
func (s *AdminContentService) getUserMap(ids []uint) map[uint]userInfo {
	if len(ids) == 0 {
		return map[uint]userInfo{}
	}
	db := database.GetDB()
	var users []userInfo
	db.Model(&model.User{}).Select("id, email, nickname").Where("id IN ?", ids).Scan(&users)

	m := make(map[uint]userInfo, len(users))
	for _, u := range users {
		m[u.ID] = u
	}
	return m
}
