package handler

import (
	"errors"
	"fmt"

	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var rechargeService *service.RechargeService

func InitRechargeService(cfg *config.BalanceConfig, bs *service.BalanceService) {
	rechargeService = service.NewRechargeService(cfg, bs)
}

// GetRechargeConfig GET /api/v1/recharge/config
func GetRechargeConfig(c *gin.Context) {
	result := rechargeService.GetConfig()
	utils.Success(c, result)
}

// CreateRechargeOrder POST /api/v1/recharge/create
func CreateRechargeOrder(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.CreateRechargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := rechargeService.CreateOrder(userID, &req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidAmount) {
			utils.BadRequest(c, fmt.Sprintf("充值金额不能低于 %.0f 元",
				rechargeService.GetConfig().MinAmountYuan))
			return
		}
		utils.InternalError(c, "创建订单失败")
		return
	}

	utils.Success(c, result)
}

// PaymentCallback POST /api/v1/recharge/callback
// 此接口不需要 JWT 认证，由支付平台回调
func PaymentCallback(c *gin.Context) {
	var req dto.PaymentCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	err := rechargeService.HandleCallback(&req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidSign) {
			utils.BadRequest(c, "签名验证失败")
			return
		}
		if errors.Is(err, service.ErrOrderNotFound) {
			utils.NotFound(c, "订单不存在")
			return
		}
		utils.InternalError(c, "回调处理失败")
		return
	}

	utils.SuccessMessage(c, "success")
}

// GetOrderStatus GET /api/v1/recharge/status/:order_no
func GetOrderStatus(c *gin.Context) {
	userID := c.GetUint("userID")
	orderNo := c.Param("order_no")

	result, err := rechargeService.GetOrderStatus(userID, orderNo)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			utils.NotFound(c, "订单不存在")
			return
		}
		utils.InternalError(c, "查询订单失败")
		return
	}

	utils.Success(c, result)
}
