package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gennovelweb/bff/internal/database"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/model"
	"gorm.io/gorm"
)

type AdminConfigService struct {
	auditService *AdminAuditService
}

func NewAdminConfigService(as *AdminAuditService) *AdminConfigService {
	return &AdminConfigService{auditService: as}
}

// GetAll 获取所有配置
func (s *AdminConfigService) GetAll() ([]dto.AdminConfigItem, error) {
	db := database.GetDB()

	var configs []model.SystemConfig
	err := db.Order("config_key ASC").Find(&configs).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.AdminConfigItem, len(configs))
	for i, c := range configs {
		var value interface{}
		json.Unmarshal(c.ConfigValue, &value)

		items[i] = dto.AdminConfigItem{
			ConfigKey:   c.ConfigKey,
			ConfigValue: value,
			Description: c.Description,
			UpdatedBy:   c.UpdatedBy,
			UpdatedAt:   c.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	return items, nil
}

// BatchUpdate 批量更新配置
func (s *AdminConfigService) BatchUpdate(adminID uint,
	req *dto.UpdateConfigsRequest, ip string) error {

	db := database.GetDB()

	return db.Transaction(func(tx *gorm.DB) error {
		changes := make(map[string]interface{})

		for _, item := range req.Configs {
			valueJSON, err := json.Marshal(item.ConfigValue)
			if err != nil {
				return fmt.Errorf("配置值序列化失败: %s", item.ConfigKey)
			}

			// Upsert: 存在则更新，不存在则插入
			result := tx.Model(&model.SystemConfig{}).
				Where("config_key = ?", item.ConfigKey).
				Updates(map[string]interface{}{
					"config_value": valueJSON,
					"updated_by":   adminID,
					"updated_at":   time.Now(),
				})

			if result.RowsAffected == 0 {
				cfg := &model.SystemConfig{
					ConfigKey:   item.ConfigKey,
					ConfigValue: valueJSON,
					UpdatedBy:   adminID,
				}
				if err := tx.Create(cfg).Error; err != nil {
					return err
				}
			}

			changes[item.ConfigKey] = item.ConfigValue
		}

		// 清除 Redis 配置缓存
		s.invalidateConfigCache()

		// 审计日志
		return s.auditService.RecordWithTx(tx, adminID,
			model.AuditConfigUpdate, model.TargetTypeConfig, "",
			changes, ip)
	})
}

// invalidateConfigCache 清除 Redis 中的配置缓存
func (s *AdminConfigService) invalidateConfigCache() {
	rdb := database.GetRedis()
	if rdb == nil {
		return
	}
	keys, _ := rdb.Keys(context.Background(), "config:*").Result()
	if len(keys) > 0 {
		rdb.Del(context.Background(), keys...)
	}
}

// InitDefaultConfigs 初始化默认配置（首次部署时调用）
func (s *AdminConfigService) InitDefaultConfigs() error {
	defaults := []struct {
		Key         string
		Value       interface{}
		Description string
	}{
		{"registration.enabled", true, "是否开放注册"},
		{"registration.invite_only", false, "是否仅邀请码注册"},
		{"registration.gift_points", 1000, "新用户赠送积分"},
		{"referral.referrer_reward", 500, "邀请人奖励积分"},
		{"referral.referee_reward", 200, "被邀请人奖励积分"},
		{"balance.low_threshold", 500, "低余额预警阈值"},
		{"recharge.rate", 100, "人民币兑点数比率"},
		{"recharge.min_amount", 1, "最低充值金额(元)"},
	}

	db := database.GetDB()
	for _, def := range defaults {
		valueJSON, _ := json.Marshal(def.Value)

		// 只有不存在时才创建
		var count int64
		db.Model(&model.SystemConfig{}).Where("config_key = ?", def.Key).Count(&count)
		if count == 0 {
			db.Create(&model.SystemConfig{
				ConfigKey:   def.Key,
				ConfigValue: valueJSON,
				Description: def.Description,
			})
		}
	}

	return nil
}
