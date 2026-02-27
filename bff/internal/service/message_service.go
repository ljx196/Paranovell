package service

import (
	"errors"
	"time"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
)

var (
	ErrMessageNotFound = errors.New("message not found")
)

type MessageService struct{}

func NewMessageService() *MessageService {
	return &MessageService{}
}

// ListMessages 获取消息列表（支持类型筛选）
func (s *MessageService) ListMessages(userID uint, req *dto.MessageListRequest) (*dto.MessageListResponse, error) {
	db := database.GetDB()

	var messages []model.SystemMessage
	var total int64

	// 构建查询条件
	query := db.Model(&model.SystemMessage{}).Where("user_id = ?", userID)
	if req.MsgType != "" {
		query = query.Where("msg_type = ?", req.MsgType)
	}

	// 统计总数
	query.Count(&total)

	// 分页查询
	err := db.Where("user_id = ?", userID).
		Scopes(func(d *gorm.DB) *gorm.DB {
			if req.MsgType != "" {
				return d.Where("msg_type = ?", req.MsgType)
			}
			return d
		}).
		Order("created_at DESC").
		Offset(req.GetOffset()).
		Limit(req.GetPageSize()).
		Find(&messages).Error

	if err != nil {
		return nil, err
	}

	// 转换为响应格式
	msgResponses := make([]dto.SystemMessageResponse, len(messages))
	for i, msg := range messages {
		msgResponses[i] = dto.SystemMessageResponse{
			ID:        msg.ID,
			Title:     msg.Title,
			Content:   msg.Content,
			MsgType:   msg.MsgType,
			IsRead:    msg.IsRead,
			CreatedAt: msg.CreatedAt,
			ReadAt:    msg.ReadAt,
		}
	}

	return &dto.MessageListResponse{
		Messages: msgResponses,
		Total:    total,
		Page:     req.GetPage(),
		PageSize: req.GetPageSize(),
	}, nil
}

// GetMessage 获取单条消息
func (s *MessageService) GetMessage(userID, messageID uint) (*model.SystemMessage, error) {
	db := database.GetDB()

	var msg model.SystemMessage
	err := db.Where("id = ? AND user_id = ?", messageID, userID).First(&msg).Error
	if err != nil {
		return nil, ErrMessageNotFound
	}

	return &msg, nil
}

// MarkAsRead 标记消息为已读
func (s *MessageService) MarkAsRead(userID, messageID uint) error {
	db := database.GetDB()

	now := time.Now()
	result := db.Model(&model.SystemMessage{}).
		Where("id = ? AND user_id = ? AND is_read = ?", messageID, userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		})

	if result.RowsAffected == 0 {
		return ErrMessageNotFound
	}

	return result.Error
}

// MarkAllAsRead 标记所有消息为已读
func (s *MessageService) MarkAllAsRead(userID uint) (int64, error) {
	db := database.GetDB()

	now := time.Now()
	result := db.Model(&model.SystemMessage{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		})

	return result.RowsAffected, result.Error
}

// GetUnreadCount 获取未读消息数
func (s *MessageService) GetUnreadCount(userID uint) (int64, error) {
	db := database.GetDB()

	var count int64
	err := db.Model(&model.SystemMessage{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error

	return count, err
}
