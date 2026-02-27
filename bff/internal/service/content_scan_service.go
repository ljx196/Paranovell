package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gennovelweb/bff/internal/client"
	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
)

// ContentScanService 内容扫描服务
type ContentScanService struct {
	algorithmClient  client.AlgorithmClientInterface
	sensitiveWordSvc *AdminSensitiveWordService
	auditService     *AdminAuditService
}

// NewContentScanService 创建内容扫描服务
func NewContentScanService(algClient client.AlgorithmClientInterface, swSvc *AdminSensitiveWordService, auditSvc *AdminAuditService) *ContentScanService {
	return &ContentScanService{
		algorithmClient:  algClient,
		sensitiveWordSvc: swSvc,
		auditService:     auditSvc,
	}
}

// Scan 执行内容扫描
func (s *ContentScanService) Scan(adminID uint, req *dto.AdminScanRequest, ip string) (*dto.AdminScanResponse, error) {
	db := database.GetDB()

	// 获取所有启用的敏感词
	words, err := s.sensitiveWordSvc.GetAllEnabled()
	if err != nil {
		return nil, fmt.Errorf("获取敏感词列表失败: %w", err)
	}
	if len(words) == 0 {
		return &dto.AdminScanResponse{}, nil
	}

	// 确定扫描的用户列表
	var userIDs []uint
	if req.UserID > 0 {
		userIDs = []uint{req.UserID}
	} else {
		// 获取最近活跃的用户
		db.Model(&model.User{}).
			Select("id").
			Where("deleted_at IS NULL AND status = 1").
			Order("updated_at DESC").
			Limit(50).
			Pluck("id", &userIDs)
	}

	if len(userIDs) == 0 {
		return &dto.AdminScanResponse{}, nil
	}

	// 获取用户邮箱映射
	type userRow struct {
		ID    uint
		Email string
	}
	var users []userRow
	db.Model(&model.User{}).Select("id, email").Where("id IN ?", userIDs).Scan(&users)
	emailMap := make(map[uint]string, len(users))
	for _, u := range users {
		emailMap[u.ID] = u.Email
	}

	resp := &dto.AdminScanResponse{
		FlaggedDetails: make([]dto.AdminScanFlaggedItem, 0),
	}

	maxConv := req.GetMaxConversations()
	scannedConv := 0

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	for _, uid := range userIDs {
		if scannedConv >= maxConv {
			break
		}

		// 获取该用户最近的对话
		convResult, err := s.algorithmClient.ListConversations(ctx, uid, 1, 20)
		if err != nil {
			continue
		}

		for _, conv := range convResult.Conversations {
			if scannedConv >= maxConv {
				break
			}
			scannedConv++

			// 获取消息
			msgResult, err := s.algorithmClient.GetMessages(ctx, uid, conv.ID, 1, 100)
			if err != nil {
				continue
			}

			resp.ScannedMessages += len(msgResult.Messages)

			// 匹配敏感词
			matchedWords := make([]string, 0)
			for _, msg := range msgResult.Messages {
				contentLower := strings.ToLower(msg.Content)
				for _, w := range words {
					wordLower := strings.ToLower(w.Word)
					if strings.Contains(contentLower, wordLower) {
						// 去重
						found := false
						for _, mw := range matchedWords {
							if mw == w.Word {
								found = true
								break
							}
						}
						if !found {
							matchedWords = append(matchedWords, w.Word)
						}
					}
				}
			}

			if len(matchedWords) > 0 {
				// 创建或更新审查记录
				review := s.createOrUpdateReview(conv.ID, uid, matchedWords)
				resp.FlaggedConversations++
				resp.FlaggedDetails = append(resp.FlaggedDetails, dto.AdminScanFlaggedItem{
					ConversationID: conv.ID,
					UserID:         uid,
					UserEmail:      emailMap[uid],
					MatchedWords:   matchedWords,
					ReviewID:       review.ID,
				})
			}
		}
	}

	resp.ScannedConversations = scannedConv

	// 记录审计
	s.auditService.Record(adminID, model.AuditContentScan,
		model.TargetTypeConversation, "",
		map[string]interface{}{
			"scanned_conversations": resp.ScannedConversations,
			"scanned_messages":      resp.ScannedMessages,
			"flagged":               resp.FlaggedConversations,
		}, ip)

	return resp, nil
}

// createOrUpdateReview 创建或更新审查记录
func (s *ContentScanService) createOrUpdateReview(convID string, userID uint, matchedWords []string) *model.ContentReview {
	gdb := database.GetDB()
	reason := fmt.Sprintf("命中敏感词: [%s]", strings.Join(matchedWords, ", "))

	var existing model.ContentReview
	err := gdb.Where("conversation_id = ?", convID).First(&existing).Error
	if err == nil {
		// 更新已有记录
		existing.FlagReason = reason
		gdb.Save(&existing)
		return &existing
	}

	// 创建新记录
	review := &model.ContentReview{
		ConversationID: convID,
		UserID:         userID,
		Status:         model.ReviewStatusPending,
		FlagType:       model.FlagTypeAuto,
		FlagReason:     reason,
	}
	gdb.Create(review)
	return review
}
