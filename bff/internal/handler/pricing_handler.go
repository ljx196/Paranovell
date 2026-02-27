package handler

import (
	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var pricingService *service.PricingService

func InitPricingService(cfg *config.BalanceConfig) {
	pricingService = service.NewPricingService(cfg)
}

// GetPricingService 返回 PricingService 实例（供其他 handler 初始化使用）
func GetPricingService() *service.PricingService {
	return pricingService
}

// GetPricing GET /api/v1/pricing
func GetPricing(c *gin.Context) {
	result := pricingService.GetPricing()
	utils.Success(c, result)
}
