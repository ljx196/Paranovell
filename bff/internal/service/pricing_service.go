package service

import (
	"fmt"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/dto"
)

type PricingService struct {
	cfg *config.BalanceConfig
}

func NewPricingService(cfg *config.BalanceConfig) *PricingService {
	return &PricingService{cfg: cfg}
}

// GetPricing 获取费率配置
func (s *PricingService) GetPricing() *dto.PricingResponse {
	models := make([]dto.ModelPricingResponse, len(s.cfg.Models))
	for i, m := range s.cfg.Models {
		models[i] = dto.ModelPricingResponse{
			Name:        m.Name,
			DisplayName: m.DisplayName,
			InputPrice:  m.InputPrice,
			OutputPrice: m.OutputPrice,
			Unit:        "1K Tokens",
		}
	}

	return &dto.PricingResponse{
		Models:              models,
		ExchangeRate:        s.cfg.ExchangeRate,
		ExchangeDescription: fmt.Sprintf("1 元 = %d 点", s.cfg.ExchangeRate),
	}
}

// CalculatePoints 根据模型和 token 数计算消耗点数
func (s *PricingService) CalculatePoints(modelName string, inputTokens, outputTokens int) int64 {
	for _, m := range s.cfg.Models {
		if m.Name == modelName {
			inputCost := int64(m.InputPrice) * int64(inputTokens) / 1000
			outputCost := int64(m.OutputPrice) * int64(outputTokens) / 1000
			total := inputCost + outputCost
			if total < 1 {
				total = 1
			}
			return total
		}
	}
	// 未知模型使用标准费率
	return int64(inputTokens)/1000 + int64(outputTokens)*2/1000
}
