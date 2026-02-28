package service

import (
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

type QuickReplyService struct{}

func NewQuickReplyService() *QuickReplyService {
	return &QuickReplyService{}
}

// GetActiveQuickReplies 获取激活的快捷回复列表（最多3条）
func (s *QuickReplyService) GetActiveQuickReplies() (*dto.QuickReplyListResponse, error) {
	db := database.GetDB()

	var replies []model.QuickReply
	err := db.Where("is_active = ?", true).
		Order("sort_order ASC").
		Limit(3).
		Find(&replies).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.QuickReplyItem, len(replies))
	for i, r := range replies {
		items[i] = dto.QuickReplyItem{
			ID:      r.ID,
			Content: r.Content,
		}
	}

	return &dto.QuickReplyListResponse{Items: items}, nil
}
