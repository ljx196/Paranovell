package handler

import (
	"github.com/gennovelweb/bff/internal/config"
	"github.com/gennovelweb/bff/internal/dto"
	"github.com/gennovelweb/bff/internal/service"
	"github.com/gennovelweb/bff/internal/utils"
	"github.com/gin-gonic/gin"
)

var balanceService *service.BalanceService

func InitBalanceService(cfg *config.BalanceConfig) {
	balanceService = service.NewBalanceService(cfg)
}

// GetBalanceService 返回 BalanceService 实例（供其他 handler 初始化使用）
func GetBalanceService() *service.BalanceService {
	return balanceService
}

// GetBalance GET /api/v1/balance
func GetBalance(c *gin.Context) {
	userID := c.GetUint("userID")

	result, err := balanceService.GetBalance(userID)
	if err != nil {
		utils.InternalError(c, "获取余额失败")
		return
	}

	utils.Success(c, result)
}

// CheckBalance GET /api/v1/balance/check?model=standard
func CheckBalance(c *gin.Context) {
	userID := c.GetUint("userID")
	modelName := c.DefaultQuery("model", "standard")

	result, err := balanceService.CheckBalance(userID, modelName)
	if err != nil {
		utils.InternalError(c, "余额检查失败")
		return
	}

	utils.Success(c, result)
}

// GetTransactions GET /api/v1/transactions
func GetTransactions(c *gin.Context) {
	userID := c.GetUint("userID")

	var req dto.TransactionListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result, err := balanceService.GetTransactions(userID, &req)
	if err != nil {
		utils.InternalError(c, "获取交易记录失败")
		return
	}

	utils.Success(c, result)
}
