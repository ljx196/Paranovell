package service

import (
	"errors"
	"fmt"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
)

var ErrSensitiveWordNotFound = errors.New("sensitive word not found")

// AdminSensitiveWordService 敏感词管理服务
type AdminSensitiveWordService struct {
	auditService *AdminAuditService
}

// NewAdminSensitiveWordService 创建敏感词管理服务
func NewAdminSensitiveWordService(auditSvc *AdminAuditService) *AdminSensitiveWordService {
	return &AdminSensitiveWordService{auditService: auditSvc}
}

// List 敏感词列表
func (s *AdminSensitiveWordService) List(req *dto.AdminSensitiveWordListRequest) (*dto.PaginatedResult, error) {
	db := database.GetDB()

	query := db.Model(&model.SensitiveWord{})

	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.Keyword != "" {
		query = query.Where("word ILIKE ?", "%"+req.Keyword+"%")
	}
	if req.IsEnabled != nil {
		query = query.Where("is_enabled = ?", *req.IsEnabled)
	}

	var total int64
	query.Count(&total)

	var words []model.SensitiveWord
	if err := query.Order("created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Find(&words).Error; err != nil {
		return nil, err
	}

	// 批量查询创建人邮箱
	creatorIDs := make([]uint, 0)
	for _, w := range words {
		creatorIDs = append(creatorIDs, w.CreatedBy)
	}
	emailMap := s.getEmailMap(creatorIDs)

	items := make([]dto.AdminSensitiveWordItem, len(words))
	for i, w := range words {
		items[i] = dto.AdminSensitiveWordItem{
			ID:           w.ID,
			Word:         w.Word,
			Category:     w.Category,
			IsEnabled:    w.IsEnabled,
			CreatedBy:    w.CreatedBy,
			CreatorEmail: emailMap[w.CreatedBy],
			CreatedAt:    w.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return &dto.PaginatedResult{Total: total, Items: items}, nil
}

// BatchCreate 批量添加敏感词
func (s *AdminSensitiveWordService) BatchCreate(adminID uint, req *dto.AdminBatchCreateSensitiveWordsRequest, ip string) (*dto.AdminBatchCreateSensitiveWordsResponse, error) {
	db := database.GetDB()

	created := 0
	duplicates := make([]string, 0)

	for _, input := range req.Words {
		category := input.Category
		if category == "" {
			category = model.SensitiveCategoryOther
		}

		word := &model.SensitiveWord{
			Word:      input.Word,
			Category:  category,
			IsEnabled: true,
			CreatedBy: adminID,
		}

		if err := db.Create(word).Error; err != nil {
			// 唯一约束冲突 → 重复
			duplicates = append(duplicates, input.Word)
			continue
		}
		created++
	}

	if created > 0 {
		s.auditService.Record(adminID, model.AuditSensitiveCreate,
			model.TargetTypeSensitive, "",
			map[string]interface{}{"created": created, "duplicates": len(duplicates)}, ip)
	}

	return &dto.AdminBatchCreateSensitiveWordsResponse{
		Created:    created,
		Duplicates: duplicates,
	}, nil
}

// Update 修改敏感词
func (s *AdminSensitiveWordService) Update(adminID uint, id uint, req *dto.AdminUpdateSensitiveWordRequest, ip string) error {
	db := database.GetDB()

	var word model.SensitiveWord
	if err := db.First(&word, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSensitiveWordNotFound
		}
		return err
	}

	updates := map[string]interface{}{}
	if req.Word != "" {
		updates["word"] = req.Word
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.IsEnabled != nil {
		updates["is_enabled"] = *req.IsEnabled
	}

	if len(updates) == 0 {
		return nil
	}

	if err := db.Model(&word).Updates(updates).Error; err != nil {
		return err
	}

	s.auditService.Record(adminID, model.AuditSensitiveUpdate,
		model.TargetTypeSensitive, fmt.Sprintf("%d", id),
		updates, ip)

	return nil
}

// Delete 删除敏感词
func (s *AdminSensitiveWordService) Delete(adminID uint, id uint, ip string) error {
	db := database.GetDB()

	var word model.SensitiveWord
	if err := db.First(&word, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSensitiveWordNotFound
		}
		return err
	}

	if err := db.Delete(&word).Error; err != nil {
		return err
	}

	s.auditService.Record(adminID, model.AuditSensitiveDelete,
		model.TargetTypeSensitive, fmt.Sprintf("%d", id),
		map[string]interface{}{"word": word.Word, "category": word.Category}, ip)

	return nil
}

// GetAllEnabled 获取所有启用的敏感词（供扫描使用）
func (s *AdminSensitiveWordService) GetAllEnabled() ([]model.SensitiveWord, error) {
	db := database.GetDB()

	var words []model.SensitiveWord
	if err := db.Where("is_enabled = ?", true).Find(&words).Error; err != nil {
		return nil, err
	}
	return words, nil
}

// getEmailMap 批量查询用户邮箱
func (s *AdminSensitiveWordService) getEmailMap(ids []uint) map[uint]string {
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
